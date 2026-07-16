"""Mirrors DataValidator's ValidationReport.to_dict() — see
forecastiq/data/validation.py."""

from __future__ import annotations

from pydantic import BaseModel


class ValidationIssueSchema(BaseModel):
    severity: str
    code: str
    message: str
    affected_rows: int
    sample_campaign_ids: list[str]


class ValidationReportSchema(BaseModel):
    total_rows: int
    is_blocking: bool
    error_count: int
    warning_count: int
    issues: list[ValidationIssueSchema]
