"""Thin Groq wrapper. Every call site above this module asks for structured,
schema-validated output — the LLM explains a forecast the ML pipeline already
computed, it never gets to invent a number outside what it's given.

Groq's API is OpenAI-compatible chat completions with JSON mode
(`response_format={"type": "json_object"}`) rather than Gemini's native
`response_schema` — so the schema's field names/types are spelled out in the
system prompt and the returned JSON is validated against the same Pydantic
model, either way giving a schema-checked object or a clear validation error.

`client_factory` exists purely for testability: it lets tests substitute a
fake stand-in for `groq.Groq` without mocking the SDK's internals.
"""

from __future__ import annotations

import json
from typing import Callable, TypeVar

from groq import Groq
from pydantic import BaseModel

SchemaT = TypeVar("SchemaT", bound=BaseModel)


class GroqNotConfiguredError(RuntimeError):
    """Raised when GROQ_API_KEY is missing — callers should surface this
    clearly (e.g. HTTP 503), never fall back to fabricated output."""


def _schema_instructions(response_schema: type[BaseModel]) -> str:
    """A compact description of the required JSON shape, derived straight from
    the Pydantic model so the prompt can never drift from the schema used to
    validate the response."""
    schema = response_schema.model_json_schema()
    return json.dumps(schema, indent=2)


class GroqClient:
    def __init__(
        self,
        api_key: str | None,
        model: str,
        client_factory: Callable[[str], object] | None = None,
    ) -> None:
        self._model = model
        self._client = None
        if api_key:
            factory = client_factory or (lambda key: Groq(api_key=key))
            self._client = factory(api_key)

    @property
    def is_configured(self) -> bool:
        return self._client is not None

    def generate(self, prompt: str, response_schema: type[SchemaT]) -> SchemaT:
        if self._client is None:
            raise GroqNotConfiguredError(
                "No LLM API key configured — set GROQ_API_KEY or GEMINI_API_KEY "
                "in .env before requesting AI insights/chat."
            )

        response = self._client.chat.completions.create(
            model=self._model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Respond with a single JSON object and nothing else — no markdown, no "
                        "code fences, no commentary before or after it. The JSON object must "
                        f"validate against this JSON Schema:\n{_schema_instructions(response_schema)}"
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        content = response.choices[0].message.content
        return response_schema.model_validate_json(content)
