"""Mirrors the `Insights` interface in src/lib/forecast.ts field-for-field."""

from __future__ import annotations

from pydantic import BaseModel, Field


class InsightsSchema(BaseModel):
    summary: str = Field(description="2-4 sentence executive takeaway, grounded in the given context.")
    drivers: list[str] = Field(description="3-5 short bullets citing the top revenue/ROAS SHAP drivers given.")
    positives: list[str] = Field(description="What's working, grounded in the channel/campaign data given.")
    negatives: list[str] = Field(description="What's at risk, grounded in the channel/anomaly data given.")
    seasonality: str = Field(description="One sentence on seasonal pattern implied by the data given.")
    allocation: str = Field(description="One concrete budget-reallocation suggestion between two named channels.")
    risks: list[str] = Field(description="Short risk bullets grounded in the anomalies/validation flags given.")
    recommendations: list[str] = Field(description="2-3 concrete next actions.")
    flags: list[str] = Field(description="Data-quality flags, straight from the validation flags given.")
