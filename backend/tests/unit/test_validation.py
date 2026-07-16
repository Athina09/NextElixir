import pandas as pd
import pytest

from forecastiq.data.ingestion import DataIngestor
from forecastiq.data.validation import DataValidator, Severity
from forecastiq.data.schema import UNIFIED_COLUMNS


@pytest.fixture
def clean_row() -> dict:
    return {
        "date": pd.Timestamp("2026-01-01"),
        "campaign_id": "1",
        "campaign_name": "Search_Campaign_01",
        "channel": "Google Ads",
        "campaign_type": "Search",
        "spend": 100.0,
        "revenue": 400.0,
        "clicks": 50.0,
        "impressions": 1000.0,
        "conversions": 5.0,
        "daily_budget": 150.0,
        "is_revenue_estimated": False,
    }


def make_df(rows: list[dict]) -> pd.DataFrame:
    return pd.DataFrame(rows)[list(UNIFIED_COLUMNS)]


def test_real_dataset_reports_no_errors_and_flags_meta_estimate(real_data_dir):
    unified = DataIngestor().load(real_data_dir)
    report = DataValidator().validate(unified)

    assert not report.is_blocking, [i.message for i in report.errors]
    assert any(i.code == "missing_conversions_expected" for i in report.issues)


def test_clean_data_produces_no_issues(clean_row):
    df = make_df([clean_row, {**clean_row, "date": pd.Timestamp("2026-01-02")}])
    report = DataValidator().validate(df)
    assert report.issues == []


def test_duplicate_campaign_day_is_an_error(clean_row):
    df = make_df([clean_row, clean_row])
    report = DataValidator().validate(df)
    assert report.is_blocking
    assert any(i.code == "duplicate_campaign_day" for i in report.errors)


def test_invalid_date_is_an_error(clean_row):
    df = make_df([{**clean_row, "date": pd.NaT}])
    report = DataValidator().validate(df)
    assert any(i.code == "invalid_date" for i in report.errors)


def test_negative_spend_and_revenue_are_errors(clean_row):
    df = make_df([{**clean_row, "spend": -10.0, "revenue": -5.0}])
    report = DataValidator().validate(df)
    codes = {i.code for i in report.errors}
    assert {"negative_spend", "negative_revenue"} <= codes


def test_budget_mismatch_is_a_warning(clean_row):
    df = make_df([{**clean_row, "spend": 1000.0, "daily_budget": 150.0}])
    report = DataValidator().validate(df)
    assert any(i.code == "budget_mismatch" for i in report.warnings)


def test_missing_campaign_type_is_a_warning(clean_row):
    df = make_df([{**clean_row, "campaign_type": None}])
    report = DataValidator().validate(df)
    assert any(i.code == "missing_campaign_type" for i in report.warnings)


def test_mixed_delimiter_campaign_name_is_flagged(clean_row):
    df = make_df([{**clean_row, "campaign_name": "Demand Gen_NTM_Campaign"}])
    report = DataValidator().validate(df)
    assert any(i.code == "campaign_naming_inconsistency" for i in report.warnings)


def test_campaign_name_drift_is_flagged(clean_row):
    df = make_df(
        [
            clean_row,
            {**clean_row, "date": pd.Timestamp("2026-01-02"), "campaign_name": "Renamed_Campaign"},
        ]
    )
    report = DataValidator().validate(df)
    assert any(i.code == "campaign_name_drift" for i in report.warnings)


def test_report_to_dict_is_json_serializable(clean_row):
    import json

    df = make_df([{**clean_row, "spend": -1.0}])
    report = DataValidator().validate(df)
    json.dumps(report.to_dict())  # must not raise
