"""Thin Gemini wrapper. Every call site above this module asks for structured,
schema-validated output — the LLM explains a forecast the ML pipeline already
computed, it never gets to invent a number outside what it's given.

`client_factory` exists purely for testability: it lets tests substitute a
fake stand-in for `google.genai.Client` without mocking the SDK's internals.
"""

from __future__ import annotations

from typing import Callable, TypeVar

from google import genai
from google.genai import types
from pydantic import BaseModel

SchemaT = TypeVar("SchemaT", bound=BaseModel)


class GeminiNotConfiguredError(RuntimeError):
    """Raised when GEMINI_API_KEY is missing — callers should surface this
    clearly (e.g. HTTP 503), never fall back to fabricated output."""


class GeminiClient:
    def __init__(
        self,
        api_key: str | None,
        model: str,
        client_factory: Callable[[str], object] | None = None,
    ) -> None:
        self._model = model
        self._client = None
        if api_key:
            factory = client_factory or (lambda key: genai.Client(api_key=key))
            self._client = factory(api_key)

    @property
    def is_configured(self) -> bool:
        return self._client is not None

    def generate(self, prompt: str, response_schema: type[SchemaT]) -> SchemaT:
        if self._client is None:
            raise GeminiNotConfiguredError(
                "GEMINI_API_KEY is not set — configure it in .env before requesting AI insights/chat."
            )

        response = self._client.models.generate_content(
            model=self._model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=response_schema,
            ),
        )
        return response_schema.model_validate_json(response.text)
