from forecastiq.llm.insights import generate_insights
from forecastiq.schemas.insights import InsightsSchema


class _FakeClient:
    def __init__(self, response):
        self._response = response
        self.last_prompt = None
        self.last_schema = None

    def generate(self, prompt, response_schema):
        self.last_prompt = prompt
        self.last_schema = response_schema
        return self._response


def _sample_insights() -> InsightsSchema:
    return InsightsSchema(
        summary="s", drivers=[], positives=[], negatives=[], seasonality="s",
        allocation="a", risks=[], recommendations=[], flags=[],
    )


def test_generate_insights_forwards_the_schema_and_embeds_context():
    fake_response = _sample_insights()
    client = _FakeClient(fake_response)

    result = generate_insights(client, {"total_budget": 12345.0, "channels": ["Google Ads"]})

    assert result is fake_response
    assert client.last_schema is InsightsSchema
    assert "12345" in client.last_prompt
    assert "Google Ads" in client.last_prompt
    assert "never predict" in client.last_prompt.lower()
