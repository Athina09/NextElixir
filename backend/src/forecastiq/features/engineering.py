"""Feature engineering, reused identically for training and inference.

Two layers:
  1. Row-level efficiency ratios + leakage-safe daily rolling/lag features
     (`build_daily_features`) — used for analytics, anomaly detection, and as
     the raw material for the period aggregation below.
  2. Aggregate-period rollup (`build_period_table`) — the brief requires
     "aggregate-period forecasts rather than daily forecasts", so campaign-day
     rows are bucketed into fixed-size 30/60/90-day windows; each window's
     summed spend/revenue become the model's budget->revenue training example,
     with trailing daily rolling/lag stats folded in as momentum features.

`fit=True` (training) fits and persists the categorical encoders; `fit=False`
(inference/simulation) only transforms with the already-fitted encoders — the
same call path both places, so there is no train/inference skew.
"""

from __future__ import annotations

import math

import numpy as np
import pandas as pd

ROLLING_WINDOWS: tuple[int, ...] = (7, 14, 30)
LAG_DAYS: tuple[int, ...] = (1, 7, 14)
CATEGORICAL_COLUMNS: tuple[str, ...] = ("campaign_id", "channel", "campaign_type")

_UNKNOWN_CODE = -1


def _safe_divide(numerator: pd.Series, denominator: pd.Series) -> pd.Series:
    return np.where(denominator > 0, numerator / denominator.replace(0, np.nan), 0.0)


def add_efficiency_metrics(df: pd.DataFrame) -> pd.DataFrame:
    """Row-level CTR/CPA/CPC/CPM/ROAS/conversion-rate/RPC/RPI/budget-utilization."""
    out = df.copy()
    out["ctr"] = _safe_divide(out["clicks"], out["impressions"])
    out["cpc"] = _safe_divide(out["spend"], out["clicks"])
    out["cpm"] = _safe_divide(out["spend"], out["impressions"]) * 1000
    out["cpa"] = _safe_divide(out["spend"], out["conversions"])
    out["roas"] = _safe_divide(out["revenue"], out["spend"])
    out["conversion_rate"] = _safe_divide(out["conversions"], out["clicks"])
    out["revenue_per_click"] = _safe_divide(out["revenue"], out["clicks"])
    out["revenue_per_impression"] = _safe_divide(out["revenue"], out["impressions"])
    has_budget = out["daily_budget"].notna() & (out["daily_budget"] > 0)
    out["budget_utilization"] = np.where(has_budget, out["spend"] / out["daily_budget"], np.nan)
    return out


def add_time_features(df: pd.DataFrame, date_column: str = "date") -> pd.DataFrame:
    out = df.copy()
    dt = out[date_column]
    out["month"] = dt.dt.month
    out["quarter"] = dt.dt.quarter
    out["weekday"] = dt.dt.weekday
    out["is_weekend"] = (out["weekday"] >= 5).astype(int)
    return out


def add_daily_rolling_lag_features(df: pd.DataFrame) -> pd.DataFrame:
    """Trailing rolling means + lags per campaign, computed with `shift(1)` first so
    the feature for a given day never includes that day's own spend/revenue."""
    out = df.sort_values(["campaign_id", "date"]).copy()
    grouped = out.groupby("campaign_id", sort=False)

    for metric in ("spend", "revenue"):
        shifted = grouped[metric].shift(1)
        for window in ROLLING_WINDOWS:
            out[f"roll{window}_{metric}"] = (
                shifted.groupby(out["campaign_id"]).rolling(window, min_periods=1).mean().reset_index(drop=True)
            )
        for lag in LAG_DAYS:
            out[f"lag{lag}_{metric}"] = grouped[metric].shift(lag)

    rolling_lag_columns = [c for c in out.columns if c.startswith(("roll", "lag"))]
    out[rolling_lag_columns] = out[rolling_lag_columns].fillna(0.0)
    return out


def build_daily_features(df: pd.DataFrame) -> pd.DataFrame:
    """The full daily-grain feature set (efficiency + time + rolling/lag)."""
    out = add_efficiency_metrics(df)
    out = add_time_features(out)
    out = add_daily_rolling_lag_features(out)
    return out


ROLLING_LAG_MEAN_COLUMNS: tuple[str, ...] = tuple(
    f"{prefix}{n}_{metric}"
    for prefix, ns in (("roll", ROLLING_WINDOWS), ("lag", LAG_DAYS))
    for n in ns
    for metric in ("spend", "revenue")
)


def build_period_table(df: pd.DataFrame, period_days: int) -> pd.DataFrame:
    """Bucket each campaign's daily rows into fixed-size `period_days` windows and
    aggregate to the model's training/inference grain: one row per
    (campaign_id, period), spend/revenue summed, ratios recomputed from the sums,
    seasonality from the period's start date, and trailing daily momentum features
    averaged over the window (each already leakage-safe from `shift(1)` above)."""
    daily = build_daily_features(df)
    daily = daily.sort_values(["campaign_id", "date"])
    daily["_bucket"] = daily.groupby("campaign_id", sort=False).cumcount() // period_days

    agg = {
        "campaign_name": "first",
        "channel": "first",
        "campaign_type": "first",
        "date": ["min", "max", "count"],
        "spend": "sum",
        "revenue": "sum",
        "clicks": "sum",
        "impressions": "sum",
        "conversions": "sum",
        "daily_budget": "mean",
        **{col: "mean" for col in ROLLING_LAG_MEAN_COLUMNS},
    }
    grouped = daily.groupby(["campaign_id", "_bucket"], sort=False).agg(agg)
    grouped.columns = ["_".join(c).strip("_") if isinstance(c, tuple) else c for c in grouped.columns]
    grouped = grouped.rename(
        columns={
            "campaign_name_first": "campaign_name",
            "channel_first": "channel",
            "campaign_type_first": "campaign_type",
            "date_min": "period_start",
            "date_max": "period_end",
            "date_count": "period_length_days",
            "spend_sum": "spend",
            "revenue_sum": "revenue",
            "clicks_sum": "clicks",
            "impressions_sum": "impressions",
            "conversions_sum": "conversions",
            "daily_budget_mean": "daily_budget",
            **{f"{col}_mean": col for col in ROLLING_LAG_MEAN_COLUMNS},
        }
    )
    grouped = grouped.reset_index().drop(columns=["_bucket"])

    period_effi = add_efficiency_metrics(grouped)
    has_budget = period_effi["daily_budget"].notna() & (period_effi["daily_budget"] > 0)
    period_effi["budget_utilization"] = np.where(
        has_budget,
        period_effi["spend"] / (period_effi["daily_budget"] * period_effi["period_length_days"]),
        np.nan,
    )
    period_effi = add_time_features(period_effi, date_column="period_start")
    return period_effi.reset_index(drop=True)


class CategoryEncoder:
    """Deterministic category->int encoder, fit once at training time and reused
    (never refit) at inference. Unseen categories map to -1 rather than raising."""

    def __init__(self) -> None:
        self.mappings: dict[str, dict[str, int]] = {}

    def fit(self, df: pd.DataFrame, columns: tuple[str, ...] = CATEGORICAL_COLUMNS) -> "CategoryEncoder":
        for column in columns:
            categories = sorted(df[column].dropna().astype(str).unique())
            self.mappings[column] = {category: i for i, category in enumerate(categories)}
        return self

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        out = df.copy()
        for column, mapping in self.mappings.items():
            out[f"{column}_code"] = out[column].astype(str).map(mapping).fillna(_UNKNOWN_CODE).astype(int)
        return out

    def fit_transform(self, df: pd.DataFrame, columns: tuple[str, ...] = CATEGORICAL_COLUMNS) -> pd.DataFrame:
        return self.fit(df, columns).transform(df)


#: the three horizons the brief requires — training on all three (not just one)
#: is what lets the model interpolate `period_length_days` instead of
#: extrapolating to values it never saw (see FeatureEngineer.build_training_table).
SUPPORTED_HORIZONS: tuple[int, ...] = (30, 60, 90)


def build_multi_period_table(df: pd.DataFrame, period_days_list: tuple[int, ...] = SUPPORTED_HORIZONS) -> pd.DataFrame:
    """Concatenates `build_period_table` at each horizon so `period_length_days`
    (and the correspondingly-scaled spend/revenue) is a genuine, in-distribution
    training signal at 30, 60, *and* 90 days — not just 30 with 60/90 requested
    only at inference."""
    tables = [build_period_table(df, period_days) for period_days in period_days_list]
    return pd.concat(tables, ignore_index=True)


class FeatureEngineer:
    """The one place training and inference both call to go from the unified
    daily schema to the model-ready, aggregate-period feature matrix."""

    def __init__(self, period_days: int = 30) -> None:
        self.period_days = period_days
        self.encoder = CategoryEncoder()

    def build(self, df: pd.DataFrame, fit: bool, period_days: int | None = None) -> pd.DataFrame:
        period_table = build_period_table(df, period_days or self.period_days)
        if fit:
            return self.encoder.fit_transform(period_table)
        return self.encoder.transform(period_table)

    def build_training_table(self, df: pd.DataFrame, period_days_list: tuple[int, ...] = SUPPORTED_HORIZONS) -> pd.DataFrame:
        """Training-only: fits the encoder across the combined 30/60/90-day table
        so campaign/channel/type codes are consistent regardless of which
        horizon a row came from."""
        combined = build_multi_period_table(df, period_days_list)
        return self.encoder.fit_transform(combined)
