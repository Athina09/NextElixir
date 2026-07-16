"""Gemini (Google AI Studio) client with the same generate()/is_configured
surface as GroqClient — so chat and insights can run on a Google API key
when GROQ_API_KEY is not set.

Uses the Generative Language REST API via httpx (already pinned) so we do not
add a new dependency for local Gemini support.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import TypeVar

import httpx
from pydantic import BaseModel

from forecastiq.llm.groq_client import GroqNotConfiguredError


class LLMRateLimitError(RuntimeError):
    """Raised when the upstream LLM returns HTTP 429 / quota exceeded."""


SchemaT = TypeVar("SchemaT", bound=BaseModel)

_GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "{model}:generateContent"
)


def _ssl_verify() -> str | bool:
    """Honour corporate CA bundles (SSL_CERT_FILE / mac-ca.pem) when present."""
    for candidate in (
        os.environ.get("SSL_CERT_FILE"),
        os.environ.get("REQUESTS_CA_BUNDLE"),
        str(Path.home() / "mac-ca.pem"),
    ):
        if candidate and Path(candidate).is_file():
            return candidate
    return True


def _schema_instructions(response_schema: type[BaseModel]) -> str:
    return json.dumps(response_schema.model_json_schema(), indent=2)


class GeminiClient:
    def __init__(self, api_key: str | None, model: str = "gemini-1.5-flash") -> None:
        self._api_key = (api_key or "").strip() or None
        self._model = model

    @property
    def is_configured(self) -> bool:
        return self._api_key is not None

    def generate(self, prompt: str, response_schema: type[SchemaT]) -> SchemaT:
        if self._api_key is None:
            raise GroqNotConfiguredError(
                "No LLM API key configured — set GROQ_API_KEY or GEMINI_API_KEY "
                "in .env before requesting AI insights/chat."
            )

        system = (
            "Respond with a single JSON object and nothing else — no markdown, no "
            "code fences, no commentary before or after it. The JSON object must "
            f"validate against this JSON Schema:\n{_schema_instructions(response_schema)}"
        )
        url = _GEMINI_URL.format(model=self._model)
        payload = {
            "systemInstruction": {"parts": [{"text": system}]},
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.2,
                "responseMimeType": "application/json",
            },
        }
        with httpx.Client(timeout=60.0, verify=_ssl_verify()) as client:
            response = client.post(url, params={"key": self._api_key}, json=payload)
            if response.status_code >= 400:
                # Never echo the API key (it is in the request URL query string).
                detail = (
                    f"Gemini API error {response.status_code} for model {self._model}: "
                    f"{response.text[:500]}"
                )
                if response.status_code == 429:
                    raise LLMRateLimitError(
                        "Gemini quota exceeded for this API key. Wait for the free-tier "
                        "reset, enable billing in Google AI Studio, or set a GROQ_API_KEY."
                    )
                raise RuntimeError(detail)
            body = response.json()

        try:
            content = body["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError, TypeError) as exc:
            raise RuntimeError(f"Unexpected Gemini response shape: {body!r}") from exc

        return response_schema.model_validate_json(content)
