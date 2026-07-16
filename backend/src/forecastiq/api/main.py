from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from forecastiq.api.data_store import DataStore
from forecastiq.api.routers import chat, forecast, health, history, insights, reports, upload, validation
from forecastiq.core.config import Settings, get_settings
from forecastiq.core.logging import configure_logging, get_logger
from forecastiq.db.base import Base, create_engine_from_url, make_session_factory
from forecastiq.llm.groq_client import GroqClient
from forecastiq.models.pipeline import ForecastPipeline


def create_app(settings: Settings | None = None) -> FastAPI:
    """`settings` is injectable so tests can point at an isolated SQLite DB and a
    fixed model path without touching the process-wide cached Settings singleton."""
    settings = settings or get_settings()
    configure_logging(settings)
    logger = get_logger("app")

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        engine = create_engine_from_url(settings.database_url)
        Base.metadata.create_all(engine)
        app.state.session_factory = make_session_factory(engine)

        pipeline = ForecastPipeline()
        if settings.model_path.exists():
            pipeline.load_artifacts(settings.model_path)
            logger.info("Loaded model artifacts trained at %s", pipeline.artifacts.trained_at)
        else:
            logger.warning(
                "No model artifacts found at %s — run `python train.py` before serving forecasts.",
                settings.model_path,
            )
        app.state.pipeline = pipeline
        app.state.data_store = DataStore(pipeline, settings.data_dir)
        app.state.settings = settings

        groq_client = GroqClient(api_key=settings.groq_api_key, model=settings.groq_model)
        if not groq_client.is_configured:
            logger.warning("GROQ_API_KEY is not set — /insights and /chat will return 503 until it is.")
        app.state.groq_client = groq_client

        yield

    app = FastAPI(title=settings.app_name, lifespan=lifespan)

    # In development, Vite may bind 8080/8081/… when the preferred port is taken.
    # Allow any localhost origin so a port bump does not blank the dashboard via CORS.
    if settings.environment == "development":
        app.add_middleware(
            CORSMiddleware,
            allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    else:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    app.include_router(health.router)
    app.include_router(forecast.router)
    app.include_router(upload.router)
    app.include_router(validation.router)
    app.include_router(history.router)
    app.include_router(insights.router)
    app.include_router(chat.router)
    app.include_router(reports.router)

    return app


app = create_app()
