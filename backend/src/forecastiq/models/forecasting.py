"""The forecast engine.

Builds one forecast row per campaign from the trained quantile models, rolls
those rows up to channel / campaign-type / aggregate levels, and derives a
*display-only* daily timeline + probability distribution from the resulting
aggregate band. The brief requires aggregate-period forecasts, not daily ones
— the timeline is a visualization allocation of that single aggregate
forecast (by real historical day-of-week seasonality), never a second model.

Aggregation assumption (stated plainly, not hidden): campaign-level P10/P90
bands are combined into channel/type/aggregate bands via a normal
approximation — each campaign's spread is treated as approximately Gaussian
(sigma derived from its P10-P90 width) and independent of the others, so
portfolio variance sums and portfolio sigma is its square root. This is the
same convention already used by the frontend's placeholder math and is a
standard, transparent simplification for a hackathon-scope prototype — see
backend/README.md "Assumptions & limitations".
"""

from __future__ import annotations

import math

import numpy as np
import pandas as pd

from forecastiq.features.engineering import CategoryEncoder
from forecastiq.models.training import FEATURE_COLUMNS, predict_quantiles

Z_90 = 1.2815515655446004  # one-sided z for the 10th/90th percentile, normal approx
Z_75 = 0.6744897501960817  # one-sided z for the 25th/75th percentile


def _sigma_from_band(p10: np.ndarray, p90: np.ndarray) -> np.ndarray:
    return np.maximum((p90 - p10) / (2 * Z_90), 1e-9)


def _confidence_from_band(p10: np.ndarray, p50: np.ndarray, p90: np.ndarray) -> np.ndarray:
    """Tighter relative band -> higher confidence. Bounded to [0.5, 0.99] so it
    never claims false certainty or total distrust."""
    relative_width = np.where(p50 > 0, (p90 - p10) / np.maximum(p50, 1e-9), 10.0)
    confidence = 1 / (1 + relative_width)
    return np.clip(confidence, 0.5, 0.99)


def build_forecast_input(
    historical_period_table: pd.DataFrame,
    encoder: CategoryEncoder,
    horizon_days: int,
    as_of: pd.Timestamp,
    budget_overrides: dict[str, float] | None = None,
) -> pd.DataFrame:
    """One row per campaign for the upcoming `horizon_days`-day period.

    `budget_overrides` maps channel name -> total spend for the whole horizon,
    reallocated across that channel's campaigns in proportion to their most
    recent period's share of that channel's spend — the same lever the budget
    simulator UI exposes. Without an override, each campaign's spend is its own
    trailing run-rate extrapolated to the horizon length ("continue current
    course").
    """
    latest = (
        historical_period_table.sort_values("period_end")
        .groupby("campaign_id", as_index=False)
        .tail(1)
        .reset_index(drop=True)
    )
    channel_recent_spend = latest.groupby("channel")["spend"].sum()

    rows = []
    for _, last in latest.iterrows():
        recent_daily_spend = last["spend"] / max(last["period_length_days"], 1)
        run_rate_spend = recent_daily_spend * horizon_days

        if budget_overrides and last["channel"] in budget_overrides:
            channel_total = channel_recent_spend.get(last["channel"], 0.0)
            share = (last["spend"] / channel_total) if channel_total > 0 else 0.0
            spend = budget_overrides[last["channel"]] * share
        else:
            spend = run_rate_spend

        row = {
            "campaign_id": last["campaign_id"],
            "campaign_name": last["campaign_name"],
            "channel": last["channel"],
            "campaign_type": last["campaign_type"],
            "spend": spend,
            "daily_budget": last["daily_budget"],
            "period_length_days": horizon_days,
            "month": as_of.month,
            "quarter": as_of.quarter,
            "weekday": as_of.weekday(),
            "is_weekend": int(as_of.weekday() >= 5),
            "ctr": last["ctr"],
            "conversion_rate": last["conversion_rate"],
        }
        for col in FEATURE_COLUMNS:
            if col.startswith(("roll", "lag")):
                row[col] = last[col]
        rows.append(row)

    forecast_input = pd.DataFrame(rows)
    return encoder.transform(forecast_input)


def predict_campaign_forecasts(
    forecast_input: pd.DataFrame,
    revenue_models: dict[float, object],
    roas_models: dict[float, object],
) -> pd.DataFrame:
    X = forecast_input[list(FEATURE_COLUMNS)]
    revenue_q = predict_quantiles(revenue_models, X)
    roas_q_model = predict_quantiles(roas_models, X)  # kept for metrics/health, not for display

    out = forecast_input.copy()
    out["revenue_p10"] = np.maximum(revenue_q[0.1], 0.0)
    out["revenue_p50"] = np.maximum(revenue_q[0.5], 0.0)
    out["revenue_p90"] = np.maximum(revenue_q[0.9], 0.0)

    # ROAS displayed to the user is *derived* from the revenue forecast divided by
    # the (known, non-random) input budget — guaranteeing revenue and ROAS never
    # contradict each other in the UI. The independently trained ROAS model's own
    # quantiles are retained as `roas_model_p50` for evaluation/health only.
    safe_spend = out["spend"].replace(0, np.nan)
    out["roas_p10"] = (out["revenue_p10"] / safe_spend).fillna(0.0)
    out["roas_p50"] = (out["revenue_p50"] / safe_spend).fillna(0.0)
    out["roas_p90"] = (out["revenue_p90"] / safe_spend).fillna(0.0)
    out["roas_model_p50"] = roas_q_model[0.5]

    out["confidence"] = _confidence_from_band(
        out["revenue_p10"].to_numpy(), out["revenue_p50"].to_numpy(), out["revenue_p90"].to_numpy()
    )
    return out


def _aggregate_band(df: pd.DataFrame) -> tuple[float, float, float, float]:
    """Sums P50 and combines sigmas in quadrature (see module docstring). Returns
    (spend, p10, p50, p90)."""
    spend = float(df["spend"].sum())
    p50 = float(df["revenue_p50"].sum())
    sigma = float(np.sqrt((_sigma_from_band(df["revenue_p10"].to_numpy(), df["revenue_p90"].to_numpy()) ** 2).sum()))
    p10 = max(p50 - Z_90 * sigma, 0.0)
    p90 = p50 + Z_90 * sigma
    return spend, p10, p50, p90


def build_channel_forecasts(predicted: pd.DataFrame, historical_period_table: pd.DataFrame) -> list[dict]:
    channels = []
    total_p50 = float(predicted["revenue_p50"].sum()) or 1.0
    for channel, group in predicted.groupby("channel"):
        spend, p10, p50, p90 = _aggregate_band(group)
        history = historical_period_table[historical_period_table["channel"] == channel].sort_values("period_end")
        trend = history["revenue"].tail(12).tolist()
        channels.append(
            {
                "name": channel,
                "spend": spend,
                "revenue": p50,
                "roas": (p50 / spend) if spend > 0 else 0.0,
                "contribution": p50 / total_p50,
                "confidence": float(_confidence_from_band(np.array([p10]), np.array([p50]), np.array([p90]))[0]),
                "trend": trend,
            }
        )
    return channels


def build_campaign_type_rows(predicted: pd.DataFrame) -> list[dict]:
    rows = []
    for campaign_type, group in predicted.groupby("campaign_type"):
        spend, p10, p50, p90 = _aggregate_band(group)
        weights = group["spend"] / group["spend"].sum() if group["spend"].sum() > 0 else None
        ctr = float(np.average(group["ctr"], weights=weights)) if weights is not None else float(group["ctr"].mean())
        conv = (
            float(np.average(group["conversion_rate"], weights=weights))
            if weights is not None
            else float(group["conversion_rate"].mean())
        )
        rows.append(
            {
                "type": campaign_type,
                "spend": spend,
                "revenue": p50,
                "roas": (p50 / spend) if spend > 0 else 0.0,
                "ctr": ctr,
                "conv": conv,
            }
        )
    return rows


def build_campaign_rows(predicted: pd.DataFrame) -> list[dict]:
    return [
        {
            "id": str(row["campaign_id"]),
            "name": row["campaign_name"],
            "channel": row["channel"],
            "type": row["campaign_type"],
            "spend": float(row["spend"]),
            "revenue": float(row["revenue_p50"]),
            "roas": float(row["roas_p50"]),
            "ctr": float(row["ctr"]),
            "conv": float(row["conversion_rate"]),
            "confidence": float(row["confidence"]),
        }
        for _, row in predicted.iterrows()
    ]


def _weekday_seasonality(historical_df: pd.DataFrame, metric: str) -> np.ndarray:
    """Real historical weekday averages for `metric`, normalized to a share-of-week
    curve (index 0=Monday .. 6=Sunday). Falls back to a flat curve if there isn't
    enough history to estimate weekday effects."""
    if historical_df.empty or metric not in historical_df.columns:
        return np.full(7, 1 / 7)
    by_weekday = historical_df.groupby(historical_df["date"].dt.weekday)[metric].mean()
    by_weekday = by_weekday.reindex(range(7), fill_value=by_weekday.mean() if len(by_weekday) else 1.0)
    total = by_weekday.sum()
    if total <= 0:
        return np.full(7, 1 / 7)
    return (by_weekday / total).to_numpy()


def _blended_weekday_seasonality(
    historical_df: pd.DataFrame,
    metric: str,
    channel_weights: dict[str, float] | None,
) -> np.ndarray:
    """Blend per-channel weekday curves by the scenario's channel mix.

    Without this, every budget allocation produced the *same* wave shape (only
    the amplitude changed), because the timeline used one global weekday curve.
    """
    if not channel_weights:
        return _weekday_seasonality(historical_df, metric)

    positive = {ch: w for ch, w in channel_weights.items() if w > 0}
    weight_sum = sum(positive.values())
    if weight_sum <= 0:
        return _weekday_seasonality(historical_df, metric)

    blended = np.zeros(7)
    for channel, weight in positive.items():
        subset = historical_df[historical_df["channel"] == channel]
        curve = _weekday_seasonality(subset if len(subset) >= 14 else historical_df, metric)
        blended += (weight / weight_sum) * curve

    total = blended.sum()
    if total <= 0:
        return _weekday_seasonality(historical_df, metric)
    return blended / total


def build_timeline(
    aggregate_p10: float,
    aggregate_p50: float,
    aggregate_p90: float,
    total_spend: float,
    horizon_days: int,
    as_of: pd.Timestamp,
    historical_df: pd.DataFrame,
    channel_revenue_weights: dict[str, float] | None = None,
    channel_spend_weights: dict[str, float] | None = None,
) -> list[dict]:
    revenue_curve = _blended_weekday_seasonality(historical_df, "revenue", channel_revenue_weights)
    spend_curve = _blended_weekday_seasonality(historical_df, "spend", channel_spend_weights)

    dates = [as_of + pd.Timedelta(days=d) for d in range(horizon_days)]
    revenue_weights = np.array([revenue_curve[d.weekday()] for d in dates])
    revenue_weights = revenue_weights / revenue_weights.sum()
    spend_weights = np.array([spend_curve[d.weekday()] for d in dates])
    spend_weights = spend_weights / spend_weights.sum()

    sigma = _sigma_from_band(np.array([aggregate_p10]), np.array([aggregate_p90]))[0]

    timeline = []
    for day_index, (date, rw, sw) in enumerate(zip(dates, revenue_weights, spend_weights), start=1):
        day_p50 = aggregate_p50 * rw
        day_sigma = sigma * rw
        day_spend = total_spend * sw
        timeline.append(
            {
                "day": day_index,
                "date": date.date().isoformat(),
                "p10": max(day_p50 - Z_90 * day_sigma, 0.0),
                "p25": max(day_p50 - Z_75 * day_sigma, 0.0),
                "p50": day_p50,
                "p75": day_p50 + Z_75 * day_sigma,
                "p90": day_p50 + Z_90 * day_sigma,
                "roas": (day_p50 / day_spend) if day_spend > 0 else 0.0,
            }
        )
    return timeline


def build_distribution(aggregate_p50: float, aggregate_p10: float, aggregate_p90: float, n_buckets: int = 41) -> list[dict]:
    sigma = _sigma_from_band(np.array([aggregate_p10]), np.array([aggregate_p90]))[0]
    buckets = np.linspace(aggregate_p50 - 2.5 * sigma, aggregate_p50 + 2.5 * sigma, n_buckets)
    density = (1 / (sigma * math.sqrt(2 * math.pi))) * np.exp(-0.5 * ((buckets - aggregate_p50) / sigma) ** 2)
    return [{"bucket": float(b), "density": float(d)} for b, d in zip(buckets, density)]


def compute_growth(historical_df: pd.DataFrame, as_of: pd.Timestamp, horizon_days: int, forecast_p50: float) -> float:
    """Forecast P50 vs. the most recent actual `horizon_days`-day window — a real
    comparison against history, not a fabricated trend."""
    window_start = as_of - pd.Timedelta(days=horizon_days)
    recent_actual = historical_df.loc[
        (historical_df["date"] >= window_start) & (historical_df["date"] < as_of), "revenue"
    ].sum()
    if recent_actual <= 0:
        return 0.0
    return float((forecast_p50 - recent_actual) / recent_actual)


def forecast(
    historical_df: pd.DataFrame,
    historical_period_table: pd.DataFrame,
    encoder: CategoryEncoder,
    revenue_models: dict[float, object],
    roas_models: dict[float, object],
    horizon_days: int,
    as_of: pd.Timestamp,
    budget_overrides: dict[str, float] | None = None,
) -> dict:
    forecast_input = build_forecast_input(historical_period_table, encoder, horizon_days, as_of, budget_overrides)
    predicted = predict_campaign_forecasts(forecast_input, revenue_models, roas_models)

    total_spend, agg_p10, agg_p50, agg_p90 = _aggregate_band(predicted)
    confidence = float(_confidence_from_band(np.array([agg_p10]), np.array([agg_p50]), np.array([agg_p90]))[0])

    channels = build_channel_forecasts(predicted, historical_period_table)
    revenue_weight_total = sum(c["revenue"] for c in channels) or 1.0
    spend_weight_total = sum(c["spend"] for c in channels) or 1.0
    channel_revenue_weights = {c["name"]: c["revenue"] / revenue_weight_total for c in channels}
    channel_spend_weights = {c["name"]: c["spend"] / spend_weight_total for c in channels}

    return {
        "horizon_days": horizon_days,
        "total_budget": total_spend,
        "revenue": {"p10": agg_p10, "p50": agg_p50, "p90": agg_p90},
        "roas": {
            "p10": (agg_p10 / total_spend) if total_spend > 0 else 0.0,
            "p50": (agg_p50 / total_spend) if total_spend > 0 else 0.0,
            "p90": (agg_p90 / total_spend) if total_spend > 0 else 0.0,
        },
        "growth": compute_growth(historical_df, as_of, horizon_days, agg_p50),
        "confidence": confidence,
        "timeline": build_timeline(
            agg_p10,
            agg_p50,
            agg_p90,
            total_spend,
            horizon_days,
            as_of,
            historical_df,
            channel_revenue_weights=channel_revenue_weights,
            channel_spend_weights=channel_spend_weights,
        ),
        "distribution": build_distribution(agg_p50, agg_p10, agg_p90),
        "channels": channels,
        "campaign_types": build_campaign_type_rows(predicted),
        "campaigns": build_campaign_rows(predicted),
        "generated_at": as_of.isoformat(),
    }
