import pytest
from fastapi.testclient import TestClient

from forecastiq.api.deps import get_groq_client
from forecastiq.api.main import create_app
from forecastiq.schemas.insights import InsightsSchema


class _FakeGroqClient:
    def __init__(self, response):
        self._response = response

    @property
    def is_configured(self) -> bool:
        return True

    def generate(self, prompt, response_schema):
        return self._response


def _sample_insights() -> InsightsSchema:
    return InsightsSchema(
        summary="Revenue is projected to grow.",
        drivers=["Search leads ROAS"],
        positives=["Google Ads confidence is high"],
        negatives=["Meta ROAS softened"],
        seasonality="Mild uplift expected mid-quarter.",
        allocation="Shift 8% of Microsoft spend into Google Ads.",
        risks=["Two anomalies flagged in the last period"],
        recommendations=["Rebalance budget", "Monitor Meta attribution"],
        flags=["Meta revenue is a derived proxy"],
    )


@pytest.fixture
def insights_client(app_settings):
    app = create_app(app_settings)
    app.dependency_overrides[get_groq_client] = lambda: _FakeGroqClient(_sample_insights())
    with TestClient(app) as c:
        yield c


def test_insights_without_configured_key_returns_503(client):
    response = client.post(
        "/insights", json={"horizon": 30, "budget": {"google": 100_000, "meta": 50_000, "microsoft": 20_000}}
    )
    assert response.status_code == 503


def test_insights_with_configured_client_returns_grounded_payload(insights_client):
    response = insights_client.post(
        "/insights", json={"horizon": 30, "budget": {"google": 100_000, "meta": 50_000, "microsoft": 20_000}}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["summary"] == "Revenue is projected to grow."
    assert body["flags"] == ["Meta revenue is a derived proxy"]
