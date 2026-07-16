from forecastiq.db.models import ReportType
from forecastiq.reports.content import (
    TableSection,
    TextSection,
    build_data_quality_report_content,
    build_report_content,
)


def _sample_forecast() -> dict:
    return {
        "horizon_days": 30,
        "total_budget": 100_000.0,
        "revenue": {"p10": 300_000.0, "p50": 400_000.0, "p90": 500_000.0},
        "roas": {"p10": 3.0, "p50": 4.0, "p90": 5.0},
        "growth": 0.1,
        "confidence": 0.85,
        "generated_at": "2026-07-15T00:00:00",
        "timeline": [
            {"day": 1, "date": "2026-07-16", "p10": 8000, "p25": 9000, "p50": 10000, "p75": 11000, "p90": 12000, "roas": 3.5},
            {"day": 2, "date": "2026-07-17", "p10": 8100, "p25": 9100, "p50": 10100, "p75": 11100, "p90": 12100, "roas": 3.6},
        ],
        "distribution": [{"bucket": 350000.0, "density": 0.1}, {"bucket": 400000.0, "density": 0.4}],
        "channels": [
            {"name": "Google Ads", "spend": 60_000.0, "revenue": 250_000.0, "roas": 4.2, "contribution": 0.6, "confidence": 0.9},
            {"name": "Meta Ads", "spend": 40_000.0, "revenue": 150_000.0, "roas": 3.75, "contribution": 0.4, "confidence": 0.8},
        ],
        "campaign_types": [{"type": "Search", "spend": 60_000.0, "revenue": 250_000.0, "roas": 4.2, "ctr": 0.02, "conv": 0.01}],
        "campaigns": [
            {
                "id": "1", "name": "Search Campaign", "channel": "Google Ads", "type": "Search",
                "spend": 10_000.0, "revenue": 40_000.0, "roas": 4.0, "ctr": 0.02, "conv": 0.01, "confidence": 0.8,
            },
            {
                "id": "2", "name": "Social Campaign", "channel": "Meta Ads", "type": "Social",
                "spend": 8_000.0, "revenue": 20_000.0, "roas": 2.5, "ctr": 0.01, "conv": 0.005, "confidence": 0.7,
            },
        ],
    }


def _sample_insights() -> dict:
    return {
        "summary": "AI summary text",
        "risks": ["risk one"],
        "recommendations": ["rec one"],
        "allocation": "Shift budget from Meta to Google.",
    }


def test_executive_report_uses_ai_summary_when_available():
    content = build_report_content(ReportType.EXECUTIVE, _sample_forecast(), _sample_insights())
    text_sections = [s for s in content.sections if isinstance(s, TextSection)]
    assert any(s.title == "Executive summary" and s.body == "AI summary text" for s in text_sections)
    assert any(s.title == "Risks" and "risk one" in s.body for s in text_sections)
    titles = {s.title for s in content.sections}
    assert {"Scenario overview", "KPI snapshot", "Forecast bands", "Channel breakdown", "Notes & methodology"} <= titles


def test_executive_report_falls_back_without_ai():
    content = build_report_content(ReportType.EXECUTIVE, _sample_forecast(), None)
    summary = next(s for s in content.sections if isinstance(s, TextSection) and s.title == "Executive summary")
    assert "400000" in summary.body.replace(",", "")
    fallback_note = next(s for s in content.sections if s.title == "AI summary")
    assert "unavailable" in fallback_note.body.lower()


def test_forecast_report_includes_channel_and_campaign_type_tables():
    content = build_report_content(ReportType.FORECAST, _sample_forecast(), None)
    table_titles = {s.title for s in content.sections if isinstance(s, TableSection)}
    assert {
        "Forecast bands",
        "Channel breakdown",
        "Campaign type breakdown",
        "Daily forecast sample (first/last days)",
        "Revenue probability distribution",
        "KPI snapshot",
    } <= table_titles


def test_campaign_report_lists_every_campaign():
    content = build_report_content(ReportType.CAMPAIGN, _sample_forecast(), None)
    table = next(s for s in content.sections if isinstance(s, TableSection) and s.title == "Campaigns")
    assert len(table.rows) == 2
    assert table.rows[0][1] == "Search Campaign"
    assert any(s.title == "Campaign ROAS leaders & laggards" for s in content.sections)


def test_budget_report_includes_allocation_advice_when_available():
    content = build_report_content(ReportType.BUDGET, _sample_forecast(), _sample_insights())
    assert any(isinstance(s, TextSection) and "Shift budget" in s.body for s in content.sections)
    titles = {s.title for s in content.sections}
    assert {"Budget mix by channel", "Scenario overview", "Notes & methodology"} <= titles


def test_budget_report_falls_back_without_ai_allocation():
    content = build_report_content(ReportType.BUDGET, _sample_forecast(), None)
    opt = next(s for s in content.sections if isinstance(s, TextSection) and s.title == "Budget optimization")
    assert "Highest ROAS" in opt.body


def test_data_quality_report_lists_datasets_and_issues():
    validation_report = {
        "total_rows": 100,
        "error_count": 1,
        "warning_count": 1,
        "is_blocking": True,
        "issues": [
            {
                "severity": "error",
                "code": "negative_spend",
                "message": "1 row has negative spend.",
                "affected_rows": 1,
                "sample_campaign_ids": ["c1"],
            },
            {
                "severity": "warning",
                "code": "missing_campaign_type",
                "message": "2 rows missing type.",
                "affected_rows": 2,
                "sample_campaign_ids": ["c2"],
            },
        ],
    }
    datasets = [
        {"filename": "google.csv", "channel": "Google Ads", "row_count": 60, "uploaded_at": "2026-07-16T00:00:00"},
        {"filename": "meta.csv", "channel": None, "row_count": 40, "uploaded_at": "2026-07-16T00:01:00"},
    ]

    content = build_data_quality_report_content(validation_report, datasets, "2026-07-16T00:02:00")

    assert content.title == "Data Quality Report"
    dataset_table = next(s for s in content.sections if isinstance(s, TableSection) and s.title == "Uploaded datasets")
    assert len(dataset_table.rows) == 2
    assert dataset_table.rows[1][1] == "Unknown"  # None channel rendered as "Unknown"

    issues_table = next(s for s in content.sections if isinstance(s, TableSection) and s.title == "Validation issues")
    assert len(issues_table.rows) == 2
    assert issues_table.columns[-1] == "Sample campaign IDs"
    assert "c1" in issues_table.rows[0][-1]
    assert any(isinstance(s, TextSection) and s.title == "Recommended actions" for s in content.sections)


def test_data_quality_report_with_no_issues_says_so():
    validation_report = {"total_rows": 10, "error_count": 0, "warning_count": 0, "is_blocking": False, "issues": []}
    content = build_data_quality_report_content(validation_report, [], "2026-07-16T00:00:00")
    assert any(
        isinstance(s, TextSection) and s.title == "Validation issues" and "No data-quality issues" in s.body
        for s in content.sections
    )


def test_data_quality_report_includes_coverage_when_dataframe_provided():
    import pandas as pd

    validation_report = {
        "total_rows": 3,
        "error_count": 0,
        "warning_count": 0,
        "is_blocking": False,
        "issues": [],
    }
    df = pd.DataFrame(
        {
            "date": pd.to_datetime(["2026-01-01", "2026-01-02", "2026-01-03"]),
            "campaign_id": ["1", "1", "2"],
            "campaign_name": ["A", "A", "B"],
            "channel": ["Google Ads", "Google Ads", "Meta Ads"],
            "campaign_type": ["Search", "Search", "Social"],
            "spend": [10.0, 20.0, 5.0],
            "revenue": [40.0, 50.0, 8.0],
            "is_revenue_estimated": [False, False, True],
        }
    )
    content = build_data_quality_report_content(validation_report, [], "2026-07-16T00:00:00", df=df)
    titles = {s.title for s in content.sections}
    assert "Coverage by channel" in titles
    assert "Coverage by campaign type" in titles
    assert "Top 15 campaigns by spend" in titles
    assert "Notes" in titles
    summary = next(s for s in content.sections if isinstance(s, TextSection) and s.title == "Summary")
    assert "Date coverage" in summary.body
