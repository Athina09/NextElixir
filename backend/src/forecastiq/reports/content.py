"""Assembles what goes in a report, independent of output format. pdf.py,
excel.py, and csv.py each only render this shared structure — the four
report types (executive/forecast/campaign/budget) are defined once, here."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from forecastiq.db.models import ReportType


@dataclass
class TextSection:
    title: str
    body: str


@dataclass
class TableSection:
    title: str
    columns: list[str]
    rows: list[list[Any]]


@dataclass
class ReportContent:
    title: str
    generated_at: str
    sections: list[TextSection | TableSection] = field(default_factory=list)


def _forecast_band_table(forecast: dict) -> TableSection:
    return TableSection(
        title="Forecast",
        columns=["Metric", "P10", "P50", "P90"],
        rows=[
            ["Revenue", forecast["revenue"]["p10"], forecast["revenue"]["p50"], forecast["revenue"]["p90"]],
            ["ROAS", forecast["roas"]["p10"], forecast["roas"]["p50"], forecast["roas"]["p90"]],
        ],
    )


def _channel_table(forecast: dict) -> TableSection:
    return TableSection(
        title="Channel breakdown",
        columns=["Channel", "Spend", "Revenue", "ROAS", "Contribution", "Confidence"],
        rows=[
            [c["name"], c["spend"], c["revenue"], c["roas"], c["contribution"], c["confidence"]]
            for c in forecast["channels"]
        ],
    )


def _campaign_type_table(forecast: dict) -> TableSection:
    return TableSection(
        title="Campaign type breakdown",
        columns=["Type", "Spend", "Revenue", "ROAS", "CTR", "Conversion rate"],
        rows=[
            [t["type"], t["spend"], t["revenue"], t["roas"], t["ctr"], t["conv"]]
            for t in forecast["campaign_types"]
        ],
    )


def _campaign_table(forecast: dict) -> TableSection:
    return TableSection(
        title="Campaigns",
        columns=["ID", "Name", "Channel", "Type", "Spend", "Revenue", "ROAS", "CTR", "Conv.", "Confidence"],
        rows=[
            [c["id"], c["name"], c["channel"], c["type"], c["spend"], c["revenue"], c["roas"], c["ctr"], c["conv"], c["confidence"]]
            for c in forecast["campaigns"]
        ],
    )


def _fallback_summary(forecast: dict) -> str:
    """Used only when Gemini isn't configured — a real, data-grounded sentence,
    not a fabricated AI narrative."""
    return (
        f"Over the next {forecast['horizon_days']} days, projected revenue is "
        f"{forecast['revenue']['p50']:.0f} (P10-P90: {forecast['revenue']['p10']:.0f}-"
        f"{forecast['revenue']['p90']:.0f}) at a blended ROAS of {forecast['roas']['p50']:.2f}x, "
        f"with {forecast['confidence'] * 100:.0f}% model confidence."
    )


def build_report_content(report_type: ReportType, forecast: dict, insights: dict | None) -> ReportContent:
    sections: list[TextSection | TableSection] = []

    if report_type == ReportType.EXECUTIVE:
        sections.append(TextSection("Executive summary", insights["summary"] if insights else _fallback_summary(forecast)))
        sections.append(_forecast_band_table(forecast))
        if insights:
            sections.append(TextSection("Risks", "\n".join(f"- {r}" for r in insights["risks"]) or "None flagged."))
            sections.append(
                TextSection("Recommendations", "\n".join(f"- {r}" for r in insights["recommendations"]) or "None.")
            )
        else:
            sections.append(TextSection("AI summary", "AI insights unavailable — GEMINI_API_KEY is not configured."))

    elif report_type == ReportType.FORECAST:
        sections.append(_forecast_band_table(forecast))
        sections.append(_channel_table(forecast))
        sections.append(_campaign_type_table(forecast))

    elif report_type == ReportType.CAMPAIGN:
        sections.append(_campaign_table(forecast))

    elif report_type == ReportType.BUDGET:
        sections.append(_channel_table(forecast))
        if insights:
            sections.append(TextSection("Budget optimization", insights["allocation"]))

    return ReportContent(
        title=f"{report_type.value.title()} Report",
        generated_at=forecast["generated_at"],
        sections=sections,
    )
