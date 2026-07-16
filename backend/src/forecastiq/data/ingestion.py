"""CSV auto-discovery, platform detection, and normalization into the unified schema.

Adding a new platform (e.g. GA4, Shopify) later is a two-line addition: one
`_is_<platform>` signature check and one `_normalize_<platform>` function —
nothing else in the pipeline needs to change.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

from forecastiq.data.schema import Channel, UNIFIED_COLUMNS


class UnrecognizedPlatformError(Exception):
    """Raised when a CSV's columns don't match any known platform adapter."""


def _is_google(columns: set[str]) -> bool:
    return {
        "campaign_advertising_channel_type",
        "metrics_cost_micros",
        "metrics_conversions_value",
    } <= columns


def _is_bing(columns: set[str]) -> bool:
    return {"CampaignType", "TimePeriod", "CampaignId"} <= columns


def _is_meta(columns: set[str]) -> bool:
    return {"cpc", "cpm", "reach", "conversion"} <= columns and "CampaignType" not in columns


def detect_channel(df: pd.DataFrame) -> Channel:
    columns = set(df.columns)
    if _is_google(columns):
        return Channel.GOOGLE_ADS
    if _is_bing(columns):
        return Channel.MICROSOFT_ADS
    if _is_meta(columns):
        return Channel.META_ADS
    raise UnrecognizedPlatformError(
        f"Could not match columns {sorted(columns)} to a known platform adapter "
        "(Google Ads, Meta Ads, Microsoft/Bing Ads)."
    )


def _normalize_google(df: pd.DataFrame) -> pd.DataFrame:
    return pd.DataFrame(
        {
            "date": pd.to_datetime(df["segments_date"], errors="coerce"),
            "campaign_id": df["campaign_id"].astype("string"),
            "campaign_name": df["campaign_name"].astype("string").str.strip(),
            "channel": Channel.GOOGLE_ADS.value,
            "campaign_type": df["campaign_advertising_channel_type"].astype("string").str.title(),
            "spend": df["metrics_cost_micros"].astype("float64") / 1_000_000,
            "revenue": df["metrics_conversions_value"].astype("float64"),
            "clicks": df["metrics_clicks"].astype("float64"),
            "impressions": df["metrics_impressions"].astype("float64"),
            "conversions": df["metrics_conversions"].astype("float64"),
            "daily_budget": df["campaign_budget_amount"].astype("float64"),
            "is_revenue_estimated": False,
        }
    )


def _normalize_bing(df: pd.DataFrame) -> pd.DataFrame:
    return pd.DataFrame(
        {
            "date": pd.to_datetime(df["TimePeriod"], errors="coerce"),
            "campaign_id": df["CampaignId"].astype("string"),
            "campaign_name": df["CampaignName"].astype("string").str.strip(),
            "channel": Channel.MICROSOFT_ADS.value,
            "campaign_type": df["CampaignType"].astype("string").str.title(),
            "spend": df["Spend"].astype("float64"),
            "revenue": df["Revenue"].astype("float64"),
            "clicks": df["Clicks"].astype("float64"),
            "impressions": df["Impressions"].astype("float64"),
            "conversions": df["Conversions"].astype("float64"),
            "daily_budget": df["DailyBudget"].astype("float64"),
            "is_revenue_estimated": False,
        }
    )


def _normalize_meta(df: pd.DataFrame) -> pd.DataFrame:
    out = pd.DataFrame(
        {
            "date": pd.to_datetime(df["date_start"], errors="coerce"),
            "campaign_id": df["campaign_id"].astype("string"),
            "campaign_name": df["campaign_name"].astype("string").str.strip(),
            "channel": Channel.META_ADS.value,
            "campaign_type": "Social",
            "spend": df["spend"].astype("float64"),
            # `conversion` is a currency-scale value in this export (decimals up to
            # 26,538.58, sometimes exceeding same-row spend) — not an integer conversion
            # count. Mapped to revenue per the documented data-quality decision; see
            # backend/README.md "Known data limitations".
            "revenue": df["conversion"].astype("float64"),
            "clicks": df["clicks"].astype("float64"),
            "impressions": df["impressions"].astype("float64"),
            "conversions": pd.Series(np.nan, index=df.index, dtype="float64"),
            "daily_budget": pd.to_numeric(df["daily_budget"], errors="coerce"),
            "is_revenue_estimated": True,
        }
    )
    return out


_NORMALIZERS = {
    Channel.GOOGLE_ADS: _normalize_google,
    Channel.MICROSOFT_ADS: _normalize_bing,
    Channel.META_ADS: _normalize_meta,
}


def discover_csv_files(data_dir: Path) -> list[Path]:
    """Every *.csv under data_dir, sorted for determinism. Never a hardcoded filename."""
    data_dir = Path(data_dir)
    return sorted(p for p in data_dir.glob("*.csv") if p.is_file())


class DataIngestor:
    """Loads every CSV under a data directory and normalizes it into the unified schema."""

    def load(self, data_dir: Path) -> pd.DataFrame:
        files = discover_csv_files(data_dir)
        if not files:
            raise FileNotFoundError(f"No CSV files found under {data_dir}")

        frames: list[pd.DataFrame] = []
        for path in files:
            raw = pd.read_csv(path, index_col=0)
            channel = detect_channel(raw)
            normalized = _NORMALIZERS[channel](raw)
            frames.append(normalized[list(UNIFIED_COLUMNS)])

        unified = pd.concat(frames, ignore_index=True)
        unified["campaign_type"] = unified["campaign_type"].fillna("Unknown")
        return unified.sort_values(["channel", "campaign_id", "date"]).reset_index(drop=True)
