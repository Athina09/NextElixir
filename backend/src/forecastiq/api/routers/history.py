from __future__ import annotations

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from forecastiq.api.data_store import DataStore
from forecastiq.api.deps import get_data_store, get_db, get_pipeline
from forecastiq.data.schema import Channel
from forecastiq.db.repositories.forecast_run_repository import ForecastRunRepository
from forecastiq.models.pipeline import ForecastPipeline
from forecastiq.schemas.forecast import ForecastResultSchema, ForecastRunSummarySchema

router = APIRouter(prefix="/forecast-runs", tags=["history"])

_BUDGET_KEY_TO_CHANNEL = {
    "google": Channel.GOOGLE_ADS.value,
    "meta": Channel.META_ADS.value,
    "microsoft": Channel.MICROSOFT_ADS.value,
}


@router.get("", response_model=list[ForecastRunSummarySchema])
def list_forecast_runs(db: Session = Depends(get_db)) -> list[ForecastRunSummarySchema]:
    runs = ForecastRunRepository(db).list_recent()
    return [ForecastRunSummarySchema.from_orm_run(r) for r in runs]


@router.delete("/{run_id}")
def delete_forecast_run(run_id: int, db: Session = Depends(get_db)) -> dict:
    deleted = ForecastRunRepository(db).delete(run_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Forecast run not found")
    return {"deleted": True}


@router.post("/{run_id}/rerun", response_model=ForecastResultSchema)
def rerun_forecast_run(
    run_id: int,
    pipeline: ForecastPipeline = Depends(get_pipeline),
    data_store: DataStore = Depends(get_data_store),
    db: Session = Depends(get_db),
) -> ForecastResultSchema:
    repo = ForecastRunRepository(db)
    run = repo.get(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail="Forecast run not found")

    df = data_store.get()
    as_of = pd.Timestamp.now().normalize()
    budget_overrides = {_BUDGET_KEY_TO_CHANNEL[k]: v for k, v in run.budget.items()}

    result = pipeline.forecast(df, horizon_days=run.horizon_days, as_of=as_of, budget_overrides=budget_overrides)
    repo.create(
        horizon_days=run.horizon_days,
        budget=run.budget,
        result=result,
        revenue_p50=result["revenue"]["p50"],
        roas_p50=result["roas"]["p50"],
        confidence=result["confidence"],
    )
    return ForecastResultSchema.from_pipeline_output(result)
