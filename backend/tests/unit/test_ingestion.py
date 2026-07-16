import pandas as pd
import pytest

from forecastiq.data.ingestion import (
    DataIngestor,
    UnrecognizedPlatformError,
    detect_channel,
    discover_csv_files,
)
from forecastiq.data.schema import UNIFIED_COLUMNS, Channel


def test_discover_csv_files_finds_all_three_platforms(real_data_dir):
    files = discover_csv_files(real_data_dir)
    names = {f.name for f in files}
    assert names == {
        "google_ads_campaign_stats.csv",
        "meta_ads_campaign_stats.csv",
        "bing_campaign_stats.csv",
    }


def test_discover_csv_files_raises_on_empty_dir(tmp_path):
    ingestor = DataIngestor()
    with pytest.raises(FileNotFoundError):
        ingestor.load(tmp_path)


def test_detect_channel_rejects_unknown_schema():
    df = pd.DataFrame({"foo": [1], "bar": [2]})
    with pytest.raises(UnrecognizedPlatformError):
        detect_channel(df)


def test_load_normalizes_all_three_real_csvs_into_unified_schema(real_data_dir):
    unified = DataIngestor().load(real_data_dir)

    assert list(unified.columns) == list(UNIFIED_COLUMNS)
    assert set(unified["channel"].unique()) == {c.value for c in Channel}
    assert unified["date"].notna().all()
    # known row counts from source-data profiling (19272 + 3417 + 2873)
    assert len(unified) == 19272 + 3417 + 2873


def test_meta_rows_are_flagged_as_revenue_estimated(real_data_dir):
    unified = DataIngestor().load(real_data_dir)
    meta_rows = unified[unified["channel"] == Channel.META_ADS.value]

    assert meta_rows["is_revenue_estimated"].all()
    assert meta_rows["conversions"].isna().all()
    assert (meta_rows["campaign_type"] == "Social").all()
    # revenue is the mapped `conversion` column: it must be non-negative and populated
    assert meta_rows["revenue"].notna().all()
    assert (meta_rows["revenue"] >= 0).all()


def test_google_and_bing_rows_have_real_conversions(real_data_dir):
    unified = DataIngestor().load(real_data_dir)
    for channel in (Channel.GOOGLE_ADS, Channel.MICROSOFT_ADS):
        rows = unified[unified["channel"] == channel.value]
        assert not rows["is_revenue_estimated"].any()
        assert rows["conversions"].notna().all()


def test_google_cost_micros_converted_to_currency_units(real_data_dir):
    unified = DataIngestor().load(real_data_dir)
    google_rows = unified[unified["channel"] == Channel.GOOGLE_ADS.value]
    # cost_micros values run into the tens of millions; converted spend should be
    # in a plausible per-row currency range, never in the millions.
    assert google_rows["spend"].max() < 100_000
