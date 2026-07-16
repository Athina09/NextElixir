"""Serves both the initial dashboard load and every budget-simulator slider
change — the frontend already debounces client-side (see
src/lib/forecast-context.tsx), so one endpoint covers "forecast" and
"simulate" alike, matching `predictForecast(budget, horizon)` in
src/lib/forecast.ts exactly."""

from __future__ import annotations

import pandas as pd
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from forecastiq.api.data_store import DataStore
from forecastiq.api.deps import get_data_store, get_db, get_pipeline
from forecastiq.core.logging import get_logger
from forecastiq.data.schema import Channel
from forecastiq.db.models import RunStatus
from forecastiq.db.repositories.forecast_run_repository import ForecastRunRepository
from forecastiq.models.pipeline import ForecastPipeline
from forecastiq.schemas.forecast import ForecastRequestSchema, ForecastResultSchema

router = APIRouter(prefix="/forecast", tags=["forecast"])

_BUDGET_KEY_TO_CHANNEL = {
    "google": Channel.GOOGLE_ADS.value,
    "meta": Channel.META_ADS.value,
    "microsoft": Channel.MICROSOFT_ADS.value,
}


@router.post("", response_model=ForecastResultSchema)
def create_forecast(
    payload: ForecastRequestSchema,
    pipeline: ForecastPipeline = Depends(get_pipeline),
    data_store: DataStore = Depends(get_data_store),
    db: Session = Depends(get_db),
) -> ForecastResultSchema:
    logger = get_logger("api")
    df = data_store.get()
    as_of = pd.Timestamp.now().normalize()

    budget_dict = payload.budget.model_dump()
    budget_overrides = {_BUDGET_KEY_TO_CHANNEL[k]: v for k, v in budget_dict.items()}

    result = pipeline.forecast(df, horizon_days=payload.horizon, as_of=as_of, budget_overrides=budget_overrides)
    logger.info(
        "forecast horizon=%d total_budget=%.2f revenue_p50=%.2f",
        payload.horizon,
        result["total_budget"],
        result["revenue"]["p50"],
    )

    # History persistence is best-effort — a readonly/locked SQLite file (or a
    # missing Postgres) must never blank the dashboard forecast response.
    try:
        ForecastRunRepository(db).create(
            horizon_days=payload.horizon,
            budget=budget_dict,
            result=result,
            revenue_p50=result["revenue"]["p50"],
            roas_p50=result["roas"]["p50"],
            confidence=result["confidence"],
            status=RunStatus.COMPLETED,
        )
    except Exception:
        logger.exception("Failed to persist forecast run — returning forecast without history")
        db.rollback()

    return ForecastResultSchema.from_pipeline_output(result)
