"""Mirrors `AssistantPayload` and its nested types in src/services/chatService.ts
field-for-field, restricted to the `MessageKind` values the AI itself ever
produces ("user"/"system" are UI-only message roles, never an AI response kind)."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

from forecastiq.schemas.forecast import BudgetAllocationSchema

AssistantMessageKind = Literal["assistant", "risk", "recommendation", "forecast-summary", "budget-optimization"]


class ChatCitationSchema(BaseModel):
    label: str
    source: str
    detail: str | None = None


class ReasoningDriverSchema(BaseModel):
    label: str
    value: str
    weight: float


class ReasoningSchema(BaseModel):
    title: str
    drivers: list[ReasoningDriverSchema]


class RiskItemSchema(BaseModel):
    label: str
    severity: Literal["low", "medium", "high"]
    note: str


class BudgetRecommendationSchema(BaseModel):
    channel: str
    current: float
    proposed: float
    delta: float
    rationale: str


class AssistantPayloadSchema(BaseModel):
    kind: AssistantMessageKind
    markdown: str
    citations: list[ChatCitationSchema] | None = None
    reasoning: ReasoningSchema | None = None
    risks: list[RiskItemSchema] | None = None
    budget: list[BudgetRecommendationSchema] | None = None


class ChatRequestSchema(BaseModel):
    message: str
    session_id: int | None = None
    horizon: Literal[30, 60, 90]
    budget: BudgetAllocationSchema


class ChatResponseSchema(BaseModel):
    session_id: int
    payload: AssistantPayloadSchema
