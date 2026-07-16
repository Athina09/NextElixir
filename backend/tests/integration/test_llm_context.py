from forecastiq.llm.context import build_context


def test_build_context_includes_all_expected_sections():
    forecast = {
        "horizon_days": 30,
        "total_budget": 100.0,
        "revenue": {"p10": 1, "p50": 2, "p90": 3},
        "roas": {"p10": 1, "p50": 2, "p90": 3},
        "growth": 0.1,
        "confidence": 0.8,
        "channels": [{"name": "Google Ads"}],
        "campaign_types": [{"type": "Search"}],
    }
    validation_report = {"error_count": 0, "warning_count": 1, "issues": [{"message": "test issue"}]}

    context = build_context(
        forecast, revenue_drivers=[], roas_drivers=[], anomalies=[], validation_report=validation_report
    )

    assert context["horizon_days"] == 30
    assert context["total_budget"] == 100.0
    assert context["channels"] == [{"name": "Google Ads"}]
    assert context["validation_issue_counts"] == {"errors": 0, "warnings": 1}
    assert context["validation_flags"] == ["test issue"]


def test_build_context_calls_to_dict_on_dataclass_items():
    class Fake:
        def to_dict(self):
            return {"key": "value"}

    context = build_context(
        {
            "horizon_days": 30,
            "total_budget": 0,
            "revenue": {},
            "roas": {},
            "growth": 0,
            "confidence": 0,
            "channels": [],
            "campaign_types": [],
        },
        revenue_drivers=[Fake()],
        roas_drivers=[],
        anomalies=[Fake()],
        validation_report={},
    )
    assert context["top_revenue_drivers"] == [{"key": "value"}]
    assert context["anomalies"] == [{"key": "value"}]
