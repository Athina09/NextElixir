"""The one place that assembles what the LLM is allowed to see. Insights and
chat both build their prompt from this same summary so neither can drift from
what the other sees, and neither can invent a number this summary doesn't
contain — "LLM never predicts, only explains" only holds if both call sites
share one grounding context, not two independently-assembled ones.

Kept deliberately small: free-tier Groq TPM limits reject oversized prompts
(~6k–12k tokens), so we strip sparkline trends and cap list lengths.
"""

from __future__ import annotations

from typing import Any


def _to_dict(item: Any) -> Any:
    return item.to_dict() if hasattr(item, "to_dict") else item


def _compact_channel(channel: dict[str, Any]) -> dict[str, Any]:
    return {
        "name": channel.get("name"),
        "spend": channel.get("spend"),
        "revenue": channel.get("revenue"),
        "roas": channel.get("roas"),
        "contribution": channel.get("contribution"),
        "confidence": channel.get("confidence"),
    }


def build_context(
    forecast: dict[str, Any],
    revenue_drivers: list[Any],
    roas_drivers: list[Any],
    anomalies: list[Any],
    validation_report: dict[str, Any],
) -> dict[str, Any]:
    campaign_types = sorted(
        forecast.get("campaign_types") or [],
        key=lambda row: float(row.get("revenue") or 0),
        reverse=True,
    )[:8]

    return {
        "horizon_days": forecast["horizon_days"],
        "total_budget": forecast["total_budget"],
        "revenue": forecast["revenue"],
        "roas": forecast["roas"],
        "growth": forecast["growth"],
        "confidence": forecast["confidence"],
        "channels": [_compact_channel(c) for c in forecast.get("channels") or []],
        "campaign_types": campaign_types,
        "top_revenue_drivers": [_to_dict(d) for d in revenue_drivers[:5]],
        "top_roas_drivers": [_to_dict(d) for d in roas_drivers[:5]],
        "anomalies": [_to_dict(a) for a in anomalies[:8]],
        "validation_issue_counts": {
            "errors": validation_report.get("error_count", 0),
            "warnings": validation_report.get("warning_count", 0),
        },
        "validation_flags": [
            issue["message"] for issue in (validation_report.get("issues") or [])[:6]
        ],
    }
