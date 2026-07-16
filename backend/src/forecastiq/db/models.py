"""Dashboard/history persistence only. The ML pipeline never reads from or
writes to these tables — forecasts are always recomputed live from
pickle/model.pkl + the current data/ contents; only the *history* of past
runs (inputs + a serialized result snapshot for display) is stored here,
never row-level predictions.
"""

from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum as SAEnum, Float, ForeignKey, Integer, JSON, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from forecastiq.db.base import Base


class RunStatus(str, enum.Enum):
    COMPLETED = "completed"
    DRAFT = "draft"
    FAILED = "failed"


class ReportType(str, enum.Enum):
    EXECUTIVE = "executive"
    FORECAST = "forecast"
    CAMPAIGN = "campaign"
    BUDGET = "budget"
    DATA_QUALITY = "data_quality"


class ReportFormat(str, enum.Enum):
    PDF = "pdf"
    CSV = "csv"
    EXCEL = "excel"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    name: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Dataset(Base):
    __tablename__ = "datasets"

    id: Mapped[int] = mapped_column(primary_key=True)
    filename: Mapped[str] = mapped_column(String(500))
    channel: Mapped[str | None] = mapped_column(String(50), nullable=True)
    row_count: Mapped[int] = mapped_column(Integer, default=0)
    validation_report: Mapped[dict] = mapped_column(JSON, default=dict)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ForecastRun(Base):
    __tablename__ = "forecast_runs"

    id: Mapped[int] = mapped_column(primary_key=True)
    horizon_days: Mapped[int] = mapped_column(Integer)
    budget: Mapped[dict] = mapped_column(JSON)
    result: Mapped[dict] = mapped_column(JSON)
    revenue_p50: Mapped[float] = mapped_column(Float)
    roas_p50: Mapped[float] = mapped_column(Float)
    confidence: Mapped[float] = mapped_column(Float)
    status: Mapped[RunStatus] = mapped_column(SAEnum(RunStatus), default=RunStatus.COMPLETED)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Scenario(Base):
    __tablename__ = "scenarios"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    horizon_days: Mapped[int] = mapped_column(Integer)
    budget_a: Mapped[dict] = mapped_column(JSON)
    budget_b: Mapped[dict] = mapped_column(JSON)
    result_a: Mapped[dict] = mapped_column(JSON)
    result_b: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(primary_key=True)
    forecast_run_id: Mapped[int | None] = mapped_column(ForeignKey("forecast_runs.id"), nullable=True)
    report_type: Mapped[ReportType] = mapped_column(SAEnum(ReportType))
    format: Mapped[ReportFormat] = mapped_column(SAEnum(ReportFormat))
    file_path: Mapped[str] = mapped_column(String(1000))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255), default="New conversation")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    messages: Mapped[list["ChatMessage"]] = relationship(back_populates="session", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("chat_sessions.id"))
    role: Mapped[str] = mapped_column(String(50))
    text: Mapped[str] = mapped_column(String)
    payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    session: Mapped["ChatSession"] = relationship(back_populates="messages")
