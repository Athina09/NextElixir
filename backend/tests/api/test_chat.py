import pytest
from fastapi.testclient import TestClient

from forecastiq.api.deps import get_groq_client
from forecastiq.api.main import create_app
from forecastiq.schemas.chat import AssistantPayloadSchema


class _FakeGroqClient:
    def __init__(self, response):
        self._response = response

    @property
    def is_configured(self) -> bool:
        return True

    def generate(self, prompt, response_schema):
        return self._response


def _sample_payload() -> AssistantPayloadSchema:
    return AssistantPayloadSchema(
        kind="forecast-summary",
        markdown="## Forecast summary\nRevenue is on track.",
        citations=[{"label": "Forecast run", "source": "ForecastIQ pipeline"}],
    )


@pytest.fixture
def chat_client(app_settings):
    app = create_app(app_settings)
    app.dependency_overrides[get_groq_client] = lambda: _FakeGroqClient(_sample_payload())
    with TestClient(app) as c:
        yield c


def test_chat_without_configured_key_returns_503(client):
    response = client.post(
        "/chat",
        json={"message": "Explain this forecast", "horizon": 30, "budget": {"google": 1, "meta": 1, "microsoft": 1}},
    )
    assert response.status_code == 503


def test_chat_creates_a_session_and_persists_messages(chat_client):
    response = chat_client.post(
        "/chat",
        json={
            "message": "Explain this forecast",
            "horizon": 30,
            "budget": {"google": 100_000, "meta": 50_000, "microsoft": 20_000},
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["session_id"] > 0
    assert body["payload"]["kind"] == "forecast-summary"
    assert "Revenue is on track" in body["payload"]["markdown"]


def test_chat_reuses_an_existing_session_id(chat_client):
    first = chat_client.post(
        "/chat",
        json={"message": "Hi", "horizon": 30, "budget": {"google": 1, "meta": 1, "microsoft": 1}},
    ).json()
    second = chat_client.post(
        "/chat",
        json={
            "message": "Follow up",
            "session_id": first["session_id"],
            "horizon": 30,
            "budget": {"google": 1, "meta": 1, "microsoft": 1},
        },
    ).json()
    assert second["session_id"] == first["session_id"]
