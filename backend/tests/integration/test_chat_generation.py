from forecastiq.llm.chat import generate_chat_response
from forecastiq.schemas.chat import AssistantPayloadSchema


class _FakeClient:
    def __init__(self, response):
        self._response = response
        self.last_prompt = None
        self.last_schema = None

    def generate(self, prompt, response_schema):
        self.last_prompt = prompt
        self.last_schema = response_schema
        return self._response


def test_generate_chat_response_forwards_schema_context_and_question():
    fake_response = AssistantPayloadSchema(kind="assistant", markdown="hi")
    client = _FakeClient(fake_response)

    result = generate_chat_response(client, "Why is ROAS dropping?", {"total_budget": 500.0})

    assert result is fake_response
    assert client.last_schema is AssistantPayloadSchema
    assert "500" in client.last_prompt
    assert "Why is ROAS dropping?" in client.last_prompt
    assert "never invent a number" in client.last_prompt.lower()
