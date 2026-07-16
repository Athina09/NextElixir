from __future__ import annotations

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from groq import RateLimitError

from forecastiq.api.data_store import DataStore
from forecastiq.api.deps import get_data_store, get_groq_client, get_pipeline
from forecastiq.data.schema import Channel
from forecastiq.llm.context import build_context
from forecastiq.llm.gemini_client import LLMRateLimitError
from forecastiq.llm.groq_client import GroqClient, GroqNotConfiguredError
from forecastiq.llm.insights import generate_insights
from forecastiq.models.pipeline import ForecastPipeline
from forecastiq.schemas.forecast import ForecastRequestSchema
from forecastiq.schemas.insights import InsightsSchema

router = APIRouter(prefix="/insights", tags=["insights"])

_BUDGET_KEY_TO_CHANNEL = {
    "google": Channel.GOOGLE_ADS.value,
    "meta": Channel.META_ADS.value,
    "microsoft": Channel.MICROSOFT_ADS.value,
}


@router.post("", response_model=InsightsSchema)
def create_insights(
    payload: ForecastRequestSchema,
    pipeline: ForecastPipeline = Depends(get_pipeline),
    data_store: DataStore = Depends(get_data_store),
    groq_client: GroqClient = Depends(get_groq_client),
) -> InsightsSchema:
    """Recomputes the forecast + SHAP + anomalies server-side rather than trusting
    a client-supplied forecast blob — the AI always reasons over the same source
    of truth the /forecast endpoint just produced, matching the frontend's
    chained predictForecast() -> generateInsights() flow (see
    src/lib/forecast-context.tsx)."""
    df = data_store.get()
    as_of = pd.Timestamp.now().normalize()
    budget_overrides = {_BUDGET_KEY_TO_CHANNEL[k]: v for k, v in payload.budget.model_dump().items()}

    forecast_result = pipeline.forecast(
        df, horizon_days=payload.horizon, as_of=as_of, budget_overrides=budget_overrides
    )
    explanation = pipeline.explain(df, top_n=5)
    anomalies = pipeline.detect_anomalies(df)
    validation_report = pipeline.validate(df).to_dict()

    context = build_context(
        forecast_result,
        explanation["revenue_drivers"],
        explanation["roas_drivers"],
        anomalies,
        validation_report,
    )

    try:
        return generate_insights(groq_client, context)
    except GroqNotConfiguredError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except (RateLimitError, LLMRateLimitError) as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc
