"""The unified schema every raw platform export gets normalized into.

Every downstream stage (validation, feature engineering, training, forecasting,
run.sh's scripts, and the FastAPI service layer) reads only this shape — never
a platform-specific column name. This is what "one shared pipeline" means in
practice: one normalized DataFrame contract, many collaborators consuming it.
"""

from enum import StrEnum


class Channel(StrEnum):
    GOOGLE_ADS = "Google Ads"
    META_ADS = "Meta Ads"
    MICROSOFT_ADS = "Microsoft Ads"


# Column order also doubles as the canonical column order for any CSV/parquet
# intermediate artifact written between pipeline stages.
UNIFIED_COLUMNS: tuple[str, ...] = (
    "date",  # datetime64[ns], normalized to midnight UTC-naive
    "campaign_id",  # str — coerced to string even where the source is numeric
    "campaign_name",  # str
    "channel",  # one of Channel
    "campaign_type",  # str — source taxonomy where available (e.g. "Search",
    #                         "Performance Max"), else a fixed per-channel value
    "spend",  # float, source currency as-is (existing attribution is source of truth)
    "revenue",  # float — may be NaN only where the source platform truly has none
    "clicks",  # float (kept float to tolerate upstream partial-day estimates)
    "impressions",  # float
    "conversions",  # float — NaN where the source has no true conversion-count field
    "daily_budget",  # float
    "is_revenue_estimated",  # bool — True where `revenue` was derived rather than a
    #                                verbatim source field (e.g. Meta's proxy mapping)
)

UNIFIED_DTYPES: dict[str, str] = {
    "date": "datetime64[ns]",
    "campaign_id": "string",
    "campaign_name": "string",
    "channel": "string",
    "campaign_type": "string",
    "spend": "float64",
    "revenue": "float64",
    "clicks": "float64",
    "impressions": "float64",
    "conversions": "float64",
    "daily_budget": "float64",
    "is_revenue_estimated": "bool",
}
