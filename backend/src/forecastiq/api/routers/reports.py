from __future__ import annotations

from typing import Literal

import pandas as pd
from fastapi import APIRouter, Depends, Response
from groq import RateLimitError
from pydantic import BaseModel
from sqlalchemy.orm import Session

from forecastiq.api.data_store import DataStore
from forecastiq.api.deps import get_data_store, get_db, get_groq_client, get_pipeline
from forecastiq.data.schema import Channel
from forecastiq.db.models import ReportFormat, ReportType
from forecastiq.db.repositories.report_repository import ReportRepository
from forecastiq.llm.context import build_context
from forecastiq.llm.gemini_client import LLMRateLimitError
from forecastiq.llm.groq_client import GroqClient, GroqNotConfiguredError
from forecastiq.llm.insights import generate_insights
from forecastiq.models.pipeline import ForecastPipeline
from forecastiq.reports.content import build_report_content
from forecastiq.reports.csv import render_csv
from forecastiq.reports.excel import render_excel
from forecastiq.reports.pdf import render_pdf
from forecastiq.schemas.forecast import BudgetAllocationSchema
from forecastiq.core.logging import get_logger

router = APIRouter(prefix="/reports", tags=["reports"])

_BUDGET_KEY_TO_CHANNEL = {
    "google": Channel.GOOGLE_ADS.value,
    "meta": Channel.META_ADS.value,
    "microsoft": Channel.MICROSOFT_ADS.value,
}

_MEDIA_TYPES = {
    ReportFormat.PDF: "application/pdf",
    ReportFormat.CSV: "text/csv",
    ReportFormat.EXCEL: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}
_EXTENSIONS = {ReportFormat.PDF: "pdf", ReportFormat.CSV: "csv", ReportFormat.EXCEL: "xlsx"}
_RENDERERS = {ReportFormat.PDF: render_pdf, ReportFormat.CSV: render_csv, ReportFormat.EXCEL: render_excel}


class ReportRequestSchema(BaseModel):
    report_type: Literal["executive", "forecast", "campaign", "budget"]
    format: Literal["pdf", "csv", "excel"]
    horizon: Literal[30, 60, 90]
    budget: BudgetAllocationSchema


@router.post("")
def create_report(
    payload: ReportRequestSchema,
    pipeline: ForecastPipeline = Depends(get_pipeline),
    data_store: DataStore = Depends(get_data_store),
    groq_client: GroqClient = Depends(get_groq_client),
    db: Session = Depends(get_db),
) -> Response:
    df = data_store.get()
    as_of = pd.Timestamp.now().normalize()
    budget_overrides = {_BUDGET_KEY_TO_CHANNEL[k]: v for k, v in payload.budget.model_dump().items()}

    forecast_result = pipeline.forecast(
        df, horizon_days=payload.horizon, as_of=as_of, budget_overrides=budget_overrides
    )

    # AI summary is best-effort: a report must still generate if Groq isn't
    # configured — content.py falls back to a real, data-grounded summary sentence.
    insights = None
    if groq_client.is_configured:
        try:
            explanation = pipeline.explain(df, top_n=5)
            anomalies = pipeline.detect_anomalies(df)
            validation_report = pipeline.validate(df).to_dict()
            context = build_context(
                forecast_result, explanation["revenue_drivers"], explanation["roas_drivers"], anomalies, validation_report
            )
            insights = generate_insights(groq_client, context).model_dump()
        except (GroqNotConfiguredError, RateLimitError, LLMRateLimitError, Exception):
            # Rate limit / LLM failure — fall back to the non-AI report rather than fail it.
            insights = None

    report_type = ReportType(payload.report_type)
    report_format = ReportFormat(payload.format)
    content = build_report_content(report_type, forecast_result, insights)
    file_bytes = _RENDERERS[report_format](content)

    filename = f"{report_type.value}-report.{_EXTENSIONS[report_format]}"
    logger = get_logger("api")
    try:
        ReportRepository(db).create(
            forecast_run_id=None,
            report_type=report_type,
            format=report_format,
            file_path=f"streamed:{filename}",  # not blob-stored — generated on demand and returned directly
        )
    except Exception:
        logger.exception("Failed to persist report metadata — still returning download")
        db.rollback()

    return Response(
        content=file_bytes,
        media_type=_MEDIA_TYPES[report_format],
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
