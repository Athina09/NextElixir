"""The single source of truth for `output/predictions.csv`'s columns.

Neither the AIgnition Project Brief nor the Hackathon Submission Guide states
the exact column names/order that were "announced at the launch" — that
announcement isn't in either document on file. This schema is therefore a
well-justified default (aggregate/channel/campaign-type/campaign-level
P10/P50/P90 revenue + ROAS across all three required horizons, exactly
matching the brief's stated deliverables), isolated to this one file so it is
a one-file fix if the real announced schema differs. See backend/README.md
"Known limitations" — track down the official format before the submission
deadline.
"""

from __future__ import annotations

import pandas as pd

PREDICTIONS_COLUMNS: tuple[str, ...] = (
    "horizon_days",
    "level",
    "entity_id",
    "entity_name",
    "spend",
    "revenue_p10",
    "revenue_p50",
    "revenue_p90",
    "roas_p10",
    "roas_p50",
    "roas_p90",
    "confidence",
    "generated_at",
)


def _rows_for_horizon(forecast_result: dict) -> list[dict]:
    rows = [
        {
            "horizon_days": forecast_result["horizon_days"],
            "level": "aggregate",
            "entity_id": "TOTAL",
            "entity_name": "TOTAL",
            "spend": forecast_result["total_budget"],
            "revenue_p10": forecast_result["revenue"]["p10"],
            "revenue_p50": forecast_result["revenue"]["p50"],
            "revenue_p90": forecast_result["revenue"]["p90"],
            "roas_p10": forecast_result["roas"]["p10"],
            "roas_p50": forecast_result["roas"]["p50"],
            "roas_p90": forecast_result["roas"]["p90"],
            "confidence": forecast_result["confidence"],
            "generated_at": forecast_result["generated_at"],
        }
    ]

    for channel in forecast_result["channels"]:
        rows.append(
            {
                "horizon_days": forecast_result["horizon_days"],
                "level": "channel",
                "entity_id": channel["name"],
                "entity_name": channel["name"],
                "spend": channel["spend"],
                "revenue_p10": None,
                "revenue_p50": channel["revenue"],
                "revenue_p90": None,
                "roas_p10": None,
                "roas_p50": channel["roas"],
                "roas_p90": None,
                "confidence": channel["confidence"],
                "generated_at": forecast_result["generated_at"],
            }
        )

    for campaign_type in forecast_result["campaign_types"]:
        rows.append(
            {
                "horizon_days": forecast_result["horizon_days"],
                "level": "campaign_type",
                "entity_id": campaign_type["type"],
                "entity_name": campaign_type["type"],
                "spend": campaign_type["spend"],
                "revenue_p10": None,
                "revenue_p50": campaign_type["revenue"],
                "revenue_p90": None,
                "roas_p10": None,
                "roas_p50": campaign_type["roas"],
                "roas_p90": None,
                "confidence": None,
                "generated_at": forecast_result["generated_at"],
            }
        )

    for campaign in forecast_result["campaigns"]:
        rows.append(
            {
                "horizon_days": forecast_result["horizon_days"],
                "level": "campaign",
                "entity_id": campaign["id"],
                "entity_name": campaign["name"],
                "spend": campaign["spend"],
                "revenue_p10": None,
                "revenue_p50": campaign["revenue"],
                "revenue_p90": None,
                "roas_p10": None,
                "roas_p50": campaign["roas"],
                "roas_p90": None,
                "confidence": campaign["confidence"],
                "generated_at": forecast_result["generated_at"],
            }
        )

    return rows


def build_predictions_dataframe(forecast_results: list[dict]) -> pd.DataFrame:
    """`forecast_results` is one `ForecastPipeline.forecast()` output per horizon
    (30/60/90 days, per the brief)."""
    rows: list[dict] = []
    for result in forecast_results:
        rows.extend(_rows_for_horizon(result))
    return pd.DataFrame(rows, columns=list(PREDICTIONS_COLUMNS))
