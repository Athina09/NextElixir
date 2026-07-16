import pytest
from pydantic import BaseModel

from forecastiq.llm.gemini_client import GeminiClient, GeminiNotConfiguredError


class _Echo(BaseModel):
    value: str


def test_generate_raises_when_not_configured():
    client = GeminiClient(api_key=None, model="gemini-2.5-flash")
    assert not client.is_configured
    with pytest.raises(GeminiNotConfiguredError):
        client.generate("hello", response_schema=_Echo)


def test_generate_parses_response_through_injected_fake_sdk_client():
    """Exercises GeminiClient's own request/parse logic with a fake stand-in for
    google.genai.Client — no real Gemini call is made (no API key is available in
    this environment), but the wrapper logic itself is fully covered."""

    class _FakeResponse:
        text = '{"value": "hi"}'

    class _FakeModels:
        def generate_content(self, *, model, contents, config):
            assert model == "gemini-2.5-flash"
            assert "hello" in contents
            return _FakeResponse()

    class _FakeSDKClient:
        def __init__(self):
            self.models = _FakeModels()

    client = GeminiClient(api_key="fake-key", model="gemini-2.5-flash", client_factory=lambda key: _FakeSDKClient())
    assert client.is_configured

    result = client.generate("hello", response_schema=_Echo)
    assert result == _Echo(value="hi")
