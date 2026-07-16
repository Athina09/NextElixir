"""Application configuration.

Single source of truth for every path and external setting the pipeline, the
FastAPI app, and run.sh's scripts all read from — so a path never gets
hardcoded twice.
"""

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/src/forecastiq/core/config.py -> parents[3] == backend/
BASE_DIR = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "ForecastIQ"
    environment: str = "development"
    log_level: str = "INFO"

    # Paths — overridable so run.sh's positional DATA_DIR/MODEL_PATH/OUTPUT_PATH args can
    # point anywhere without touching code.
    data_dir: Path = BASE_DIR / "data"
    pickle_dir: Path = BASE_DIR / "pickle"
    model_path: Path = BASE_DIR / "pickle" / "model.pkl"
    output_dir: Path = BASE_DIR / "output"
    log_dir: Path = BASE_DIR / "logs"

    # Database (dashboard history/users/reports/chat only — run.sh never touches this).
    # Absolute SQLite default avoids cwd-relative "readonly database" failures when
    # the API is launched from a different working directory.
    database_url: str = f"sqlite:///{(BASE_DIR / 'forecastiq_dev.db').as_posix()}"

    # LLM (explanation/chat only — never used for prediction).
    # Prefer Groq when set; otherwise fall back to Google AI Studio (Gemini).
    groq_api_key: str | None = None
    groq_model: str = "llama-3.3-70b-versatile"
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.0-flash-lite"

    # Forecasting.
    forecast_horizons: tuple[int, ...] = (30, 60, 90)

    # CORS for the TanStack Start dev/prod origins.
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173", "http://localhost:8080"]


@lru_cache
def get_settings() -> Settings:
    """Process-wide singleton, safe to depend on from FastAPI `Depends` or plain scripts."""
    return Settings()
