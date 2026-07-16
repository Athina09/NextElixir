"""Data-quality validation over the unified schema.

Produces a structured report the /upload page can render directly (mirrors the
existing severity levels already in `src/routes/upload.tsx`: valid ✓ / warning
⚠ / error ✗).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum

import pandas as pd


class Severity(StrEnum):
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"


@dataclass(frozen=True)
class ValidationIssue:
    severity: Severity
    code: str
    message: str
    affected_rows: int = 0
    sample_campaign_ids: tuple[str, ...] = ()


@dataclass
class ValidationReport:
    issues: list[ValidationIssue] = field(default_factory=list)
    total_rows: int = 0

    def add(self, severity: Severity, code: str, message: str, affected_rows: int = 0,
             sample_campaign_ids: tuple[str, ...] = ()) -> None:
        self.issues.append(ValidationIssue(severity, code, message, affected_rows, sample_campaign_ids))

    @property
    def errors(self) -> list[ValidationIssue]:
        return [i for i in self.issues if i.severity == Severity.ERROR]

    @property
    def warnings(self) -> list[ValidationIssue]:
        return [i for i in self.issues if i.severity == Severity.WARNING]

    @property
    def is_blocking(self) -> bool:
        return len(self.errors) > 0

    def to_dict(self) -> dict:
        return {
            "total_rows": self.total_rows,
            "is_blocking": self.is_blocking,
            "error_count": len(self.errors),
            "warning_count": len(self.warnings),
            "issues": [
                {
                    "severity": i.severity.value,
                    "code": i.code,
                    "message": i.message,
                    "affected_rows": i.affected_rows,
                    "sample_campaign_ids": list(i.sample_campaign_ids),
                }
                for i in self.issues
            ],
        }


def _sample_ids(series: pd.Series, limit: int = 5) -> tuple[str, ...]:
    return tuple(series.dropna().astype(str).unique()[:limit])


class DataValidator:
    """Runs every required data-quality check over a normalized (unified-schema) DataFrame."""

    #: rows whose spend exceeds daily_budget by more than this multiple are flagged
    BUDGET_MISMATCH_TOLERANCE = 1.5

    def validate(self, df: pd.DataFrame) -> ValidationReport:
        report = ValidationReport(total_rows=len(df))

        self._check_missing_values(df, report)
        self._check_duplicate_campaign_days(df, report)
        self._check_invalid_dates(df, report)
        self._check_missing_campaign_type(df, report)
        self._check_budget_mismatch(df, report)
        self._check_negative_spend(df, report)
        self._check_negative_revenue(df, report)
        self._check_missing_conversions(df, report)
        self._check_campaign_naming_inconsistency(df, report)

        return report

    def _check_missing_values(self, df: pd.DataFrame, report: ValidationReport) -> None:
        for column in ("spend", "clicks", "impressions"):
            missing = df[column].isna()
            if missing.any():
                report.add(
                    Severity.WARNING,
                    "missing_values",
                    f"{missing.sum()} rows have a missing '{column}' value.",
                    affected_rows=int(missing.sum()),
                    sample_campaign_ids=_sample_ids(df.loc[missing, "campaign_id"]),
                )

    def _check_duplicate_campaign_days(self, df: pd.DataFrame, report: ValidationReport) -> None:
        dupes = df.duplicated(subset=["campaign_id", "date"], keep=False)
        if dupes.any():
            report.add(
                Severity.ERROR,
                "duplicate_campaign_day",
                f"{dupes.sum()} rows share a duplicate (campaign_id, date) key.",
                affected_rows=int(dupes.sum()),
                sample_campaign_ids=_sample_ids(df.loc[dupes, "campaign_id"]),
            )

    def _check_invalid_dates(self, df: pd.DataFrame, report: ValidationReport) -> None:
        invalid = df["date"].isna()
        if invalid.any():
            report.add(
                Severity.ERROR,
                "invalid_date",
                f"{invalid.sum()} rows have an unparseable date.",
                affected_rows=int(invalid.sum()),
                sample_campaign_ids=_sample_ids(df.loc[invalid, "campaign_id"]),
            )

    def _check_missing_campaign_type(self, df: pd.DataFrame, report: ValidationReport) -> None:
        missing = df["campaign_type"].isna() | (df["campaign_type"] == "Unknown")
        if missing.any():
            report.add(
                Severity.WARNING,
                "missing_campaign_type",
                f"{missing.sum()} rows have no campaign type recorded.",
                affected_rows=int(missing.sum()),
                sample_campaign_ids=_sample_ids(df.loc[missing, "campaign_id"]),
            )

    def _check_budget_mismatch(self, df: pd.DataFrame, report: ValidationReport) -> None:
        has_budget = df["daily_budget"].notna() & (df["daily_budget"] > 0)
        mismatch = has_budget & (df["spend"] > df["daily_budget"] * self.BUDGET_MISMATCH_TOLERANCE)
        if mismatch.any():
            report.add(
                Severity.WARNING,
                "budget_mismatch",
                f"{mismatch.sum()} rows spend more than "
                f"{self.BUDGET_MISMATCH_TOLERANCE:.0%} of the stated daily budget.",
                affected_rows=int(mismatch.sum()),
                sample_campaign_ids=_sample_ids(df.loc[mismatch, "campaign_id"]),
            )

    def _check_negative_spend(self, df: pd.DataFrame, report: ValidationReport) -> None:
        negative = df["spend"] < 0
        if negative.any():
            report.add(
                Severity.ERROR,
                "negative_spend",
                f"{negative.sum()} rows have negative spend.",
                affected_rows=int(negative.sum()),
                sample_campaign_ids=_sample_ids(df.loc[negative, "campaign_id"]),
            )

    def _check_negative_revenue(self, df: pd.DataFrame, report: ValidationReport) -> None:
        negative = df["revenue"] < 0
        if negative.any():
            report.add(
                Severity.ERROR,
                "negative_revenue",
                f"{negative.sum()} rows have negative revenue.",
                affected_rows=int(negative.sum()),
                sample_campaign_ids=_sample_ids(df.loc[negative, "campaign_id"]),
            )

    def _check_missing_conversions(self, df: pd.DataFrame, report: ValidationReport) -> None:
        missing = df["conversions"].isna()
        if not missing.any():
            return
        estimated_channels = df.loc[missing, "is_revenue_estimated"].all()
        if estimated_channels:
            report.add(
                Severity.INFO,
                "missing_conversions_expected",
                f"{missing.sum()} rows have no true conversion-count field — expected for "
                "channels whose export only provides a revenue proxy (see 'is_revenue_estimated').",
                affected_rows=int(missing.sum()),
            )
        else:
            report.add(
                Severity.WARNING,
                "missing_conversions",
                f"{missing.sum()} rows are missing a conversions value.",
                affected_rows=int(missing.sum()),
                sample_campaign_ids=_sample_ids(df.loc[missing, "campaign_id"]),
            )

    def _check_campaign_naming_inconsistency(self, df: pd.DataFrame, report: ValidationReport) -> None:
        names = df["campaign_name"].dropna()

        mixed_delimiters = names[names.str.contains(" ") & names.str.contains("_")]
        if not mixed_delimiters.empty:
            affected = df.loc[mixed_delimiters.index]
            report.add(
                Severity.WARNING,
                "campaign_naming_inconsistency",
                f"{affected['campaign_id'].nunique()} campaign(s) mix space and underscore "
                "delimiters in their name (e.g. \"Demand Gen_NTM_Campaign\").",
                affected_rows=len(affected),
                sample_campaign_ids=_sample_ids(affected["campaign_id"]),
            )

        name_variants = df.groupby("campaign_id")["campaign_name"].nunique()
        inconsistent_ids = name_variants[name_variants > 1].index
        if len(inconsistent_ids) > 0:
            affected = df[df["campaign_id"].isin(inconsistent_ids)]
            report.add(
                Severity.WARNING,
                "campaign_name_drift",
                f"{len(inconsistent_ids)} campaign_id(s) are associated with more than one "
                "campaign_name over time.",
                affected_rows=len(affected),
                sample_campaign_ids=tuple(str(i) for i in inconsistent_ids[:5]),
            )
