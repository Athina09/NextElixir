import pytest

REPORT_TYPES = ["executive", "forecast", "campaign", "budget"]
FORMATS = ["pdf", "csv", "excel"]


@pytest.mark.parametrize("report_type", REPORT_TYPES)
@pytest.mark.parametrize("report_format", FORMATS)
def test_create_report_every_type_and_format_without_ai(client, report_type, report_format):
    """No Gemini key is configured for the shared `client` fixture — reports must
    still generate using the real, data-grounded fallback summary."""
    response = client.post(
        "/reports",
        json={
            "report_type": report_type,
            "format": report_format,
            "horizon": 30,
            "budget": {"google": 500_000, "meta": 300_000, "microsoft": 100_000},
        },
    )
    assert response.status_code == 200
    assert len(response.content) > 0
    assert "attachment" in response.headers["content-disposition"]

    if report_format == "pdf":
        assert response.content.startswith(b"%PDF")
        assert response.headers["content-type"] == "application/pdf"
    elif report_format == "csv":
        assert response.headers["content-type"].startswith("text/csv")
    elif report_format == "excel":
        assert "spreadsheetml" in response.headers["content-type"]
