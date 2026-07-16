"""FastAPI dependency providers. Every router reads the process-wide pipeline
singleton, the cached data store, and a per-request DB session through here —
never constructs its own."""

from __future__ import annotations

from collections.abc import Generator

from fastapi import Request
from sqlalchemy.orm import Session

from forecastiq.api.data_store import DataStore
from forecastiq.core.config import Settings
from forecastiq.llm.gemini_client import GeminiClient
from forecastiq.models.pipeline import ForecastPipeline


def get_app_settings(request: Request) -> Settings:
    """The exact Settings instance this app was built with — NOT the global
    `get_settings()` singleton, which would silently ignore whatever was passed
    to `create_app(settings=...)` (e.g. an isolated test data_dir)."""
    return request.app.state.settings


def get_pipeline(request: Request) -> ForecastPipeline:
    return request.app.state.pipeline


def get_data_store(request: Request) -> DataStore:
    return request.app.state.data_store


def get_gemini_client(request: Request) -> GeminiClient:
    return request.app.state.gemini_client


def get_db(request: Request) -> Generator[Session, None, None]:
    session = request.app.state.session_factory()
    try:
        yield session
    finally:
        session.close()
