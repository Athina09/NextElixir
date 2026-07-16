"""The one place that assembles what Gemini is allowed to see. Insights and
chat both build their prompt from this same summary so neither can drift from
what the other sees, and neither can invent a number this summary doesn't
contain — "LLM never predicts, only explains" only holds if both call sites
share one grounding context, not two independently-assembled ones.
"""

from __future__ import annotations

from typing import Any


def build_context(
    forecast: dict[str, Any],
    revenue_drivers: list[Any],
    roas_drivers: list[Any],
    anomalies: list[Any],
    validation_report: dict[str, Any],
) -> dict[str, Any]:
    def _to_dict(item: Any) -> Any:
        return item.to_dict() if hasattr(item, "to_dict") else item

    return {
        "horizon_days": forecast["horizon_days"],
        "total_budget": forecast["total_budget"],
        "revenue": forecast["revenue"],
        "roas": forecast["roas"],
        "growth": forecast["growth"],
        "confidence": forecast["confidence"],
        "channels": forecast["channels"],
        "campaign_types": forecast["campaign_types"],
        "top_revenue_drivers": [_to_dict(d) for d in revenue_drivers],
        "top_roas_drivers": [_to_dict(d) for d in roas_drivers],
        "anomalies": [_to_dict(a) for a in anomalies],
        "validation_issue_counts": {
            "errors": validation_report.get("error_count", 0),
            "warnings": validation_report.get("warning_count", 0),
        },
        "validation_flags": [issue["message"] for issue in validation_report.get("issues", [])],
    }
