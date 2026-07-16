"""Pick Groq (preferred) or Gemini so chat/insights work with either key."""

from __future__ import annotations

from forecastiq.core.config import Settings
from forecastiq.llm.gemini_client import GeminiClient
from forecastiq.llm.groq_client import GroqClient


def build_llm_client(settings: Settings) -> GroqClient | GeminiClient:
    if settings.groq_api_key:
        return GroqClient(api_key=settings.groq_api_key, model=settings.groq_model)
    if settings.gemini_api_key:
        return GeminiClient(api_key=settings.gemini_api_key, model=settings.gemini_model)
    # Unconfigured stand-in — generate() raises a clear 503-friendly error.
    return GroqClient(api_key=None, model=settings.groq_model)
