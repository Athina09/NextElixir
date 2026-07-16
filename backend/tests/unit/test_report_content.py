from forecastiq.db.models import ReportType
from forecastiq.reports.content import TableSection, TextSection, build_report_content


def _sample_forecast() -> dict:
    return {
        "horizon_days": 30,
        "total_budget": 100_000.0,
        "revenue": {"p10": 300_000.0, "p50": 400_000.0, "p90": 500_000.0},
        "roas": {"p10": 3.0, "p50": 4.0, "p90": 5.0},
        "growth": 0.1,
        "confidence": 0.85,
        "generated_at": "2026-07-15T00:00:00",
        "channels": [
            {"name": "Google Ads", "spend": 60_000.0, "revenue": 250_000.0, "roas": 4.2, "contribution": 0.6, "confidence": 0.9},
        ],
        "campaign_types": [{"type": "Search", "spend": 60_000.0, "revenue": 250_000.0, "roas": 4.2, "ctr": 0.02, "conv": 0.01}],
        "campaigns": [
            {
                "id": "1", "name": "Search Campaign", "channel": "Google Ads", "type": "Search",
                "spend": 10_000.0, "revenue": 40_000.0, "roas": 4.0, "ctr": 0.02, "conv": 0.01, "confidence": 0.8,
            }
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


def test_executive_report_falls_back_without_ai():
    content = build_report_content(ReportType.EXECUTIVE, _sample_forecast(), None)
    summary = next(s for s in content.sections if isinstance(s, TextSection) and s.title == "Executive summary")
    assert "400000" in summary.body.replace(",", "")
    fallback_note = next(s for s in content.sections if s.title == "AI summary")
    assert "not configured" in fallback_note.body


def test_forecast_report_includes_channel_and_campaign_type_tables():
    content = build_report_content(ReportType.FORECAST, _sample_forecast(), None)
    table_titles = {s.title for s in content.sections if isinstance(s, TableSection)}
    assert {"Forecast", "Channel breakdown", "Campaign type breakdown"} <= table_titles


def test_campaign_report_lists_every_campaign():
    content = build_report_content(ReportType.CAMPAIGN, _sample_forecast(), None)
    table = next(s for s in content.sections if isinstance(s, TableSection))
    assert table.title == "Campaigns"
    assert len(table.rows) == 1
    assert table.rows[0][1] == "Search Campaign"


def test_budget_report_includes_allocation_advice_when_available():
    content = build_report_content(ReportType.BUDGET, _sample_forecast(), _sample_insights())
    assert any(isinstance(s, TextSection) and "Shift budget" in s.body for s in content.sections)
