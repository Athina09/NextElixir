from __future__ import annotations

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from groq import RateLimitError
from sqlalchemy.orm import Session

from forecastiq.api.data_store import DataStore
from forecastiq.api.deps import get_data_store, get_db, get_groq_client, get_pipeline
from forecastiq.data.schema import Channel
from forecastiq.db.repositories.chat_repository import ChatRepository
from forecastiq.llm.chat import generate_chat_response
from forecastiq.llm.context import build_context
from forecastiq.llm.gemini_client import LLMRateLimitError
from forecastiq.llm.groq_client import GroqClient, GroqNotConfiguredError
from forecastiq.models.pipeline import ForecastPipeline
from forecastiq.schemas.chat import ChatRequestSchema, ChatResponseSchema

router = APIRouter(prefix="/chat", tags=["chat"])

_BUDGET_KEY_TO_CHANNEL = {
    "google": Channel.GOOGLE_ADS.value,
    "meta": Channel.META_ADS.value,
    "microsoft": Channel.MICROSOFT_ADS.value,
}


@router.post("", response_model=ChatResponseSchema)
def send_chat_message(
    payload: ChatRequestSchema,
    pipeline: ForecastPipeline = Depends(get_pipeline),
    data_store: DataStore = Depends(get_data_store),
    groq_client: GroqClient = Depends(get_groq_client),
    db: Session = Depends(get_db),
) -> ChatResponseSchema:
    repo = ChatRepository(db)
    session = repo.get_or_create_session(payload.session_id)
    repo.add_message(session_id=session.id, role="user", text=payload.message)

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
        assistant_payload = generate_chat_response(groq_client, payload.message, context)
    except GroqNotConfiguredError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except (RateLimitError, LLMRateLimitError) as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc

    repo.add_message(
        session_id=session.id,
        role="assistant",
        text=assistant_payload.markdown,
        payload=assistant_payload.model_dump(),
    )

    return ChatResponseSchema(session_id=session.id, payload=assistant_payload)
