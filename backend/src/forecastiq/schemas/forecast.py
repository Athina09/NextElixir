"""Pydantic mirrors of the TypeScript interfaces in src/lib/forecast.ts —
field-for-field, so the existing frontend components need zero changes once
Phase 9 wires them to these endpoints instead of the mock."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Horizon = Literal[30, 60, 90]


class BudgetAllocationSchema(BaseModel):
    google: float
    meta: float
    microsoft: float


class ForecastRequestSchema(BaseModel):
    horizon: Horizon
    budget: BudgetAllocationSchema


class RevenueBandSchema(BaseModel):
    p10: float
    p50: float
    p90: float


class ForecastPointSchema(BaseModel):
    day: int
    date: str
    p10: float
    p25: float
    p50: float
    p75: float
    p90: float
    roas: float


class DistributionPointSchema(BaseModel):
    bucket: float
    density: float


class ChannelForecastSchema(BaseModel):
    name: str
    spend: float
    revenue: float
    roas: float
    contribution: float
    confidence: float
    trend: list[float]


class CampaignTypeRowSchema(BaseModel):
    type: str
    spend: float
    revenue: float
    roas: float
    ctr: float
    conv: float


class CampaignRowSchema(BaseModel):
    id: str
    name: str
    channel: str
    type: str
    spend: float
    revenue: float
    roas: float
    ctr: float
    conv: float
    confidence: float


class ForecastResultSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    horizon: int
    total_budget: float = Field(alias="totalBudget")
    revenue: RevenueBandSchema
    roas: RevenueBandSchema
    growth: float
    confidence: float
    timeline: list[ForecastPointSchema]
    distribution: list[DistributionPointSchema]
    channels: list[ChannelForecastSchema]
    campaign_types: list[CampaignTypeRowSchema] = Field(alias="campaignTypes")
    campaigns: list[CampaignRowSchema]
    generated_at: str = Field(alias="generatedAt")

    @classmethod
    def from_pipeline_output(cls, data: dict) -> "ForecastResultSchema":
        """`data` is exactly what `ForecastPipeline.forecast()` / `.simulate_budget()`
        returns — see forecastiq/models/forecasting.py."""
        return cls(
            horizon=data["horizon_days"],
            totalBudget=data["total_budget"],
            revenue=data["revenue"],
            roas=data["roas"],
            growth=data["growth"],
            confidence=data["confidence"],
            timeline=data["timeline"],
            distribution=data["distribution"],
            channels=data["channels"],
            campaignTypes=data["campaign_types"],
            campaigns=data["campaigns"],
            generatedAt=data["generated_at"],
        )


class ForecastRunSummarySchema(BaseModel):
    """Mirrors the `Row` interface in src/routes/forecast-history.tsx."""

    id: str
    date: str
    budget: float
    revenue: float
    roas: float
    confidence: float
    status: str

    @classmethod
    def from_orm_run(cls, run) -> "ForecastRunSummarySchema":
        total_budget = sum(run.budget.values()) if isinstance(run.budget, dict) else 0.0
        status = run.status.value if hasattr(run.status, "value") else str(run.status)
        return cls(
            id=f"F-{run.id}",
            date=run.created_at.isoformat(),
            budget=total_budget,
            revenue=run.revenue_p50,
            roas=run.roas_p50,
            confidence=run.confidence,
            status=status,
        )
