import pytest


@pytest.mark.parametrize("horizon", [30, 60, 90])
def test_create_forecast_matches_frontend_contract(client, horizon):
    response = client.post(
        "/forecast",
        json={"horizon": horizon, "budget": {"google": 1_800_000, "meta": 1_200_000, "microsoft": 500_000}},
    )
    assert response.status_code == 200
    body = response.json()

    assert body["horizon"] == horizon
    assert "totalBudget" in body
    assert body["revenue"]["p10"] <= body["revenue"]["p50"] <= body["revenue"]["p90"]
    assert len(body["timeline"]) == horizon
    assert len(body["channels"]) == 3
    assert "campaignTypes" in body
    assert "generatedAt" in body
    for campaign in body["campaigns"]:
        assert set(campaign.keys()) == {
            "id", "name", "channel", "type", "spend", "revenue", "roas", "ctr", "conv", "confidence",
        }


def test_create_forecast_rejects_invalid_horizon(client):
    response = client.post(
        "/forecast",
        json={"horizon": 45, "budget": {"google": 100, "meta": 100, "microsoft": 100}},
    )
    assert response.status_code == 422


def test_forecast_is_persisted_and_listed_in_history(client):
    response = client.post(
        "/forecast",
        json={"horizon": 30, "budget": {"google": 500_000, "meta": 300_000, "microsoft": 100_000}},
    )
    assert response.status_code == 200

    history = client.get("/forecast-runs")
    assert history.status_code == 200
    runs = history.json()
    assert len(runs) >= 1
    assert runs[0]["budget"] == pytest.approx(900_000)
