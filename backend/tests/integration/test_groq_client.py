import pytest
from pydantic import BaseModel

from forecastiq.llm.groq_client import GroqClient, GroqNotConfiguredError


class _Echo(BaseModel):
    value: str


def test_generate_raises_when_not_configured():
    client = GroqClient(api_key=None, model="llama-3.3-70b-versatile")
    assert not client.is_configured
    with pytest.raises(GroqNotConfiguredError):
        client.generate("hello", response_schema=_Echo)


def test_generate_parses_response_through_injected_fake_sdk_client():
    """Exercises GroqClient's own request/parse logic with a fake stand-in for
    groq.Groq — no real Groq call is made here (see test_groq_client_live.py for
    a real, opt-in call), but the wrapper logic itself is fully covered."""

    class _FakeMessage:
        content = '{"value": "hi"}'

    class _FakeChoice:
        message = _FakeMessage()

    class _FakeResponse:
        choices = [_FakeChoice()]

    class _FakeCompletions:
        def create(self, *, model, messages, response_format, temperature):
            assert model == "llama-3.3-70b-versatile"
            assert response_format == {"type": "json_object"}
            assert messages[-1]["content"] == "hello"
            assert "value" in messages[0]["content"]  # schema instructions embedded
            return _FakeResponse()

    class _FakeChat:
        def __init__(self):
            self.completions = _FakeCompletions()

    class _FakeSDKClient:
        def __init__(self):
            self.chat = _FakeChat()

    client = GroqClient(api_key="fake-key", model="llama-3.3-70b-versatile", client_factory=lambda key: _FakeSDKClient())
    assert client.is_configured

    result = client.generate("hello", response_schema=_Echo)
    assert result == _Echo(value="hi")
