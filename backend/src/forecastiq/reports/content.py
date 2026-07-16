"""Assembles what goes in a report, independent of output format. pdf.py,
excel.py, and csv.py each only render this shared structure — the four
report types (executive/forecast/campaign/budget) are defined once, here."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

import pandas as pd

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


def _fmt_money(value: float) -> float:
    return round(float(value), 2)


def _fmt_pct(value: float) -> float:
    return round(float(value) * 100, 2)


def _forecast_band_table(forecast: dict) -> TableSection:
    rev = forecast["revenue"]
    roas = forecast["roas"]
    spend = float(forecast.get("total_budget") or 0)
    return TableSection(
        title="Forecast bands",
        columns=["Metric", "P10 (low)", "P50 (expected)", "P90 (high)", "P90−P10 spread"],
        rows=[
            [
                "Revenue",
                _fmt_money(rev["p10"]),
                _fmt_money(rev["p50"]),
                _fmt_money(rev["p90"]),
                _fmt_money(rev["p90"] - rev["p10"]),
            ],
            [
                "ROAS",
                round(float(roas["p10"]), 3),
                round(float(roas["p50"]), 3),
                round(float(roas["p90"]), 3),
                round(float(roas["p90"] - roas["p10"]), 3),
            ],
            [
                "Implied profit (rev − spend)",
                _fmt_money(rev["p10"] - spend),
                _fmt_money(rev["p50"] - spend),
                _fmt_money(rev["p90"] - spend),
                _fmt_money((rev["p90"] - spend) - (rev["p10"] - spend)),
            ],
        ],
    )


def _scenario_section(forecast: dict) -> TextSection:
    spend = float(forecast.get("total_budget") or 0)
    rev = forecast["revenue"]
    roas = forecast["roas"]
    growth = float(forecast.get("growth") or 0)
    confidence = float(forecast.get("confidence") or 0)
    n_channels = len(forecast.get("channels") or [])
    n_types = len(forecast.get("campaign_types") or [])
    n_campaigns = len(forecast.get("campaigns") or [])
    lines = [
        f"Horizon: {forecast['horizon_days']} days · Generated at {forecast['generated_at']}.",
        f"Planned spend: {spend:,.2f} · Expected revenue (P50): {rev['p50']:,.2f} · "
        f"Expected ROAS (P50): {roas['p50']:.2f}x.",
        f"Uncertainty band: revenue {rev['p10']:,.2f} → {rev['p90']:,.2f} "
        f"({((rev['p90'] - rev['p10']) / rev['p50'] * 100) if rev['p50'] else 0:.1f}% width vs P50).",
        f"Growth vs prior {forecast['horizon_days']}-day actuals: {growth * 100:+.1f}% · "
        f"Model confidence: {confidence * 100:.0f}%.",
        f"Coverage in this run: {n_channels} channel(s), {n_types} campaign type(s), "
        f"{n_campaigns} campaign(s).",
    ]
    return TextSection("Scenario overview", "\n".join(lines))


def _kpi_snapshot_table(forecast: dict) -> TableSection:
    spend = float(forecast.get("total_budget") or 0)
    rev = forecast["revenue"]
    roas = forecast["roas"]
    return TableSection(
        title="KPI snapshot",
        columns=["KPI", "Value"],
        rows=[
            ["Horizon (days)", forecast["horizon_days"]],
            ["Total planned spend", _fmt_money(spend)],
            ["Revenue P50", _fmt_money(rev["p50"])],
            ["Revenue P10 / P90", f"{_fmt_money(rev['p10'])} / {_fmt_money(rev['p90'])}"],
            ["ROAS P50", round(float(roas["p50"]), 3)],
            ["ROAS P10 / P90", f"{round(float(roas['p10']), 3)} / {round(float(roas['p90']), 3)}"],
            ["Expected profit (P50 − spend)", _fmt_money(rev["p50"] - spend)],
            ["Growth vs recent actuals", f"{float(forecast.get('growth') or 0) * 100:+.1f}%"],
            ["Model confidence", f"{float(forecast.get('confidence') or 0) * 100:.0f}%"],
            ["Channels", len(forecast.get("channels") or [])],
            ["Campaigns", len(forecast.get("campaigns") or [])],
        ],
    )


def _channel_table(forecast: dict) -> TableSection:
    total_spend = sum(float(c.get("spend") or 0) for c in forecast.get("channels") or []) or 1.0
    rows = []
    for c in forecast.get("channels") or []:
        spend = float(c.get("spend") or 0)
        revenue = float(c.get("revenue") or 0)
        rows.append(
            [
                c["name"],
                _fmt_money(spend),
                _fmt_money(revenue),
                round(float(c.get("roas") or 0), 3),
                _fmt_pct(float(c.get("contribution") or 0)),
                round(spend / total_spend * 100, 2),
                _fmt_money(revenue - spend),
                _fmt_pct(float(c.get("confidence") or 0)),
            ]
        )
    rows.sort(key=lambda r: r[1], reverse=True)
    return TableSection(
        title="Channel breakdown",
        columns=[
            "Channel",
            "Spend",
            "Revenue",
            "ROAS",
            "Revenue contribution %",
            "Spend share %",
            "Profit",
            "Confidence %",
        ],
        rows=rows,
    )


def _budget_mix_table(forecast: dict) -> TableSection:
    channels = forecast.get("channels") or []
    total = sum(float(c.get("spend") or 0) for c in channels) or 1.0
    return TableSection(
        title="Budget mix by channel",
        columns=["Channel", "Spend", "Share %", "Revenue", "ROAS", "Efficiency note"],
        rows=[
            [
                c["name"],
                _fmt_money(float(c.get("spend") or 0)),
                round(float(c.get("spend") or 0) / total * 100, 2),
                _fmt_money(float(c.get("revenue") or 0)),
                round(float(c.get("roas") or 0), 3),
                "Above blended" if float(c.get("roas") or 0) >= float(forecast["roas"]["p50"]) else "Below blended",
            ]
            for c in sorted(channels, key=lambda x: float(x.get("spend") or 0), reverse=True)
        ],
    )


def _campaign_type_table(forecast: dict) -> TableSection:
    rows = []
    for t in forecast.get("campaign_types") or []:
        spend = float(t.get("spend") or 0)
        revenue = float(t.get("revenue") or 0)
        rows.append(
            [
                t["type"],
                _fmt_money(spend),
                _fmt_money(revenue),
                round(float(t.get("roas") or 0), 3),
                _fmt_money(revenue - spend),
                round(float(t.get("ctr") or 0) * 100, 3),
                round(float(t.get("conv") or 0) * 100, 3),
            ]
        )
    rows.sort(key=lambda r: r[1], reverse=True)
    return TableSection(
        title="Campaign type breakdown",
        columns=["Type", "Spend", "Revenue", "ROAS", "Profit", "CTR %", "Conversion rate %"],
        rows=rows,
    )


def _campaign_table(forecast: dict, *, limit: int | None = None) -> TableSection:
    campaigns = list(forecast.get("campaigns") or [])
    campaigns.sort(key=lambda c: float(c.get("spend") or 0), reverse=True)
    if limit is not None:
        campaigns = campaigns[:limit]
    return TableSection(
        title="Campaigns" if limit is None else f"Top {limit} campaigns by spend",
        columns=[
            "ID",
            "Name",
            "Channel",
            "Type",
            "Spend",
            "Revenue",
            "ROAS",
            "Profit",
            "CTR %",
            "Conv. %",
            "Confidence %",
        ],
        rows=[
            [
                c["id"],
                c["name"],
                c["channel"],
                c["type"],
                _fmt_money(float(c.get("spend") or 0)),
                _fmt_money(float(c.get("revenue") or 0)),
                round(float(c.get("roas") or 0), 3),
                _fmt_money(float(c.get("revenue") or 0) - float(c.get("spend") or 0)),
                round(float(c.get("ctr") or 0) * 100, 3),
                round(float(c.get("conv") or 0) * 100, 3),
                _fmt_pct(float(c.get("confidence") or 0)),
            ]
            for c in campaigns
        ],
    )


def _campaign_roas_leaders_table(forecast: dict, *, top_n: int = 10) -> TableSection | None:
    campaigns = [c for c in (forecast.get("campaigns") or []) if float(c.get("spend") or 0) > 0]
    if not campaigns:
        return None
    ranked = sorted(campaigns, key=lambda c: float(c.get("roas") or 0), reverse=True)
    top = ranked[:top_n]
    bottom = list(reversed(ranked[-top_n:])) if len(ranked) > top_n else []
    rows = []
    for label, group in (("Top ROAS", top), ("Lowest ROAS", bottom)):
        for c in group:
            rows.append(
                [
                    label,
                    c["id"],
                    c["name"],
                    c["channel"],
                    c["type"],
                    _fmt_money(float(c.get("spend") or 0)),
                    _fmt_money(float(c.get("revenue") or 0)),
                    round(float(c.get("roas") or 0), 3),
                ]
            )
    return TableSection(
        title="Campaign ROAS leaders & laggards",
        columns=["Group", "ID", "Name", "Channel", "Type", "Spend", "Revenue", "ROAS"],
        rows=rows,
    )


def _timeline_table(forecast: dict) -> TableSection | None:
    timeline = forecast.get("timeline") or []
    if not timeline:
        return None
    if len(timeline) <= 21:
        preview = timeline
    else:
        preview = timeline[:10] + timeline[-10:]
    return TableSection(
        title="Daily forecast sample (first/last days)",
        columns=["Day", "Date", "Revenue P10", "Revenue P50", "Revenue P90", "ROAS"],
        rows=[
            [
                point.get("day"),
                point.get("date"),
                _fmt_money(float(point.get("p10") or 0)),
                _fmt_money(float(point.get("p50") or 0)),
                _fmt_money(float(point.get("p90") or 0)),
                round(float(point.get("roas") or 0), 3),
            ]
            for point in preview
        ],
    )


def _distribution_table(forecast: dict) -> TableSection | None:
    distribution = forecast.get("distribution") or []
    if not distribution:
        return None
    # Keep readable: peak + every other bucket if long.
    points = distribution if len(distribution) <= 24 else distribution[:: max(1, len(distribution) // 20)]
    return TableSection(
        title="Revenue probability distribution",
        columns=["Revenue bucket", "Density"],
        rows=[
            [_fmt_money(float(p.get("bucket") or 0)), round(float(p.get("density") or 0), 6)]
            for p in points
        ],
    )


def _methodology_notes(report_type: ReportType) -> TextSection:
    shared = [
        "• Forecast bands are aggregate-period LightGBM quantile predictions (P10 / P50 / P90), not day-by-day model runs.",
        "• The daily timeline allocates the aggregate band using historical weekday seasonality weighted by channel mix.",
        "• Growth compares forecast P50 revenue to the most recent matching historical window of the same length.",
        "• Confidence is derived from band width (tighter P10–P90 → higher confidence).",
    ]
    type_notes = {
        ReportType.EXECUTIVE: "• Executive view prioritizes narrative + KPIs; download Forecast/Campaign reports for full tables.",
        ReportType.FORECAST: "• Use this report for planning horizons and uncertainty communication with stakeholders.",
        ReportType.CAMPAIGN: "• Campaign rows are model outputs for the simulated budget — sort by ROAS/profit before reallocating.",
        ReportType.BUDGET: "• Budget mix reflects the slider allocation used for this run; re-export after changing spend.",
    }
    body = "\n".join(shared + [type_notes.get(report_type, "")])
    return TextSection("Notes & methodology", body)


def _fallback_summary(forecast: dict) -> str:
    """Used only when Groq isn't configured — a real, data-grounded paragraph,
    not a fabricated AI narrative."""
    spend = float(forecast.get("total_budget") or 0)
    rev = forecast["revenue"]
    roas = forecast["roas"]
    growth = float(forecast.get("growth") or 0)
    top_channels = sorted(
        forecast.get("channels") or [],
        key=lambda c: float(c.get("revenue") or 0),
        reverse=True,
    )[:3]
    channel_bits = ", ".join(
        f"{c['name']} ({float(c.get('contribution') or 0) * 100:.0f}% revenue, {float(c.get('roas') or 0):.2f}x ROAS)"
        for c in top_channels
    ) or "n/a"
    return (
        f"Over the next {forecast['horizon_days']} days with {spend:,.0f} planned spend, "
        f"projected revenue is {rev['p50']:,.0f} (P10–P90: {rev['p10']:,.0f}–{rev['p90']:,.0f}) "
        f"at a blended ROAS of {roas['p50']:.2f}x "
        f"({float(forecast.get('confidence') or 0) * 100:.0f}% model confidence). "
        f"Growth vs the prior matching window is {growth * 100:+.1f}%. "
        f"Top revenue contributors: {channel_bits}."
    )


def build_report_content(report_type: ReportType, forecast: dict, insights: dict | None) -> ReportContent:
    sections: list[TextSection | TableSection] = []

    if report_type == ReportType.EXECUTIVE:
        sections.append(
            TextSection(
                "Executive summary",
                insights["summary"] if insights else _fallback_summary(forecast),
            )
        )
        sections.append(_scenario_section(forecast))
        sections.append(_kpi_snapshot_table(forecast))
        sections.append(_forecast_band_table(forecast))
        sections.append(_channel_table(forecast))
        sections.append(_campaign_table(forecast, limit=10))
        leaders = _campaign_roas_leaders_table(forecast, top_n=5)
        if leaders:
            sections.append(leaders)
        if insights:
            sections.append(
                TextSection("Risks", "\n".join(f"- {r}" for r in insights["risks"]) or "None flagged.")
            )
            sections.append(
                TextSection(
                    "Recommendations",
                    "\n".join(f"- {r}" for r in insights["recommendations"]) or "None.",
                )
            )
            if insights.get("allocation"):
                sections.append(TextSection("Budget allocation advice", insights["allocation"]))
        else:
            sections.append(
                TextSection(
                    "AI summary",
                    "AI insights unavailable — configure GROQ_API_KEY or GEMINI_API_KEY for narrative risks/recommendations. "
                    "Numeric sections above are still generated from the live forecast.",
                )
            )

    elif report_type == ReportType.FORECAST:
        sections.append(_scenario_section(forecast))
        sections.append(_kpi_snapshot_table(forecast))
        sections.append(_forecast_band_table(forecast))
        timeline = _timeline_table(forecast)
        if timeline:
            sections.append(timeline)
        distribution = _distribution_table(forecast)
        if distribution:
            sections.append(distribution)
        sections.append(_channel_table(forecast))
        sections.append(_campaign_type_table(forecast))
        sections.append(_campaign_table(forecast, limit=15))
        if insights and insights.get("summary"):
            sections.append(TextSection("AI narrative", insights["summary"]))

    elif report_type == ReportType.CAMPAIGN:
        sections.append(_scenario_section(forecast))
        sections.append(_kpi_snapshot_table(forecast))
        sections.append(_channel_table(forecast))
        sections.append(_campaign_type_table(forecast))
        sections.append(_campaign_table(forecast))
        leaders = _campaign_roas_leaders_table(forecast, top_n=10)
        if leaders:
            sections.append(leaders)
        if insights and insights.get("recommendations"):
            sections.append(
                TextSection(
                    "Recommendations",
                    "\n".join(f"- {r}" for r in insights["recommendations"]),
                )
            )

    elif report_type == ReportType.BUDGET:
        sections.append(_scenario_section(forecast))
        sections.append(_kpi_snapshot_table(forecast))
        sections.append(_budget_mix_table(forecast))
        sections.append(_channel_table(forecast))
        sections.append(_forecast_band_table(forecast))
        sections.append(_campaign_type_table(forecast))
        sections.append(_campaign_table(forecast, limit=15))
        leaders = _campaign_roas_leaders_table(forecast, top_n=5)
        if leaders:
            sections.append(leaders)
        if insights and insights.get("allocation"):
            sections.append(TextSection("Budget optimization", insights["allocation"]))
        else:
            # Data-grounded fallback when LLM allocation advice is missing.
            channels = sorted(
                forecast.get("channels") or [],
                key=lambda c: float(c.get("roas") or 0),
                reverse=True,
            )
            if channels:
                best, worst = channels[0], channels[-1]
                sections.append(
                    TextSection(
                        "Budget optimization",
                        f"Highest ROAS channel in this run: {best['name']} ({float(best.get('roas') or 0):.2f}x). "
                        f"Lowest ROAS channel: {worst['name']} ({float(worst.get('roas') or 0):.2f}x). "
                        f"Consider shifting marginal budget toward higher-ROAS channels while watching confidence "
                        f"and contribution caps. Re-run the forecast after any slider change to refresh this report.",
                    )
                )

    sections.append(_methodology_notes(report_type))

    return ReportContent(
        title=f"{report_type.value.title()} Report",
        generated_at=forecast["generated_at"],
        sections=sections,
    )


def build_data_quality_report_content(
    validation_report: dict,
    datasets: list[dict],
    generated_at: str,
    df: pd.DataFrame | None = None,
) -> ReportContent:
    """The Upload Data page's downloadable report — same shared TextSection/
    TableSection/renderers as the forecast-driven reports above, but built
    from the current validation state + dataset history instead of a
    forecast (uploads have no horizon/budget context).

    When `df` (unified schema) is provided, adds channel coverage, campaign-type
    mix, top campaigns, and richer issue detail so the export is useful beyond
    a thin summary.
    """
    total_rows = int(validation_report.get("total_rows") or 0)
    error_count = int(validation_report.get("error_count") or 0)
    warning_count = int(validation_report.get("warning_count") or 0)
    is_blocking = bool(validation_report.get("is_blocking"))
    issues = validation_report.get("issues") or []

    sections: list[TextSection | TableSection] = []

    # ── Summary ────────────────────────────────────────────────────────────
    summary_lines = [
        f"{total_rows:,} rows across {len(datasets)} tracked upload(s).",
        f"{error_count} error(s), {warning_count} warning(s)"
        + (f", {sum(1 for i in issues if i.get('severity') == 'info')} info flag(s)." if issues else "."),
        f"Blocking status: {'BLOCKING — fix errors before trusting forecasts.' if is_blocking else 'Non-blocking — forecasts can run with current warnings.'}",
    ]
    if df is not None and not getattr(df, "empty", True):
        date_min = pd.to_datetime(df["date"]).min()
        date_max = pd.to_datetime(df["date"]).max()
        n_campaigns = int(df["campaign_id"].nunique())
        n_channels = int(df["channel"].nunique())
        total_spend = float(df["spend"].fillna(0).sum())
        total_revenue = float(df["revenue"].fillna(0).sum())
        estimated = int(df["is_revenue_estimated"].fillna(False).sum()) if "is_revenue_estimated" in df.columns else 0
        summary_lines.extend(
            [
                f"Date coverage: {date_min.date().isoformat()} → {date_max.date().isoformat()} "
                f"({(date_max - date_min).days + 1} calendar days).",
                f"Active entities: {n_campaigns:,} campaigns across {n_channels} channel(s).",
                f"Totals: spend {total_spend:,.2f} · revenue {total_revenue:,.2f} · "
                f"blended ROAS {(total_revenue / total_spend) if total_spend > 0 else 0:.2f}x.",
                f"Revenue proxy rows (estimated): {estimated:,} ({(estimated / total_rows * 100) if total_rows else 0:.1f}%).",
            ]
        )
    sections.append(TextSection("Summary", "\n".join(summary_lines)))

    # ── Uploaded datasets ──────────────────────────────────────────────────
    if datasets:
        sections.append(
            TableSection(
                title="Uploaded datasets",
                columns=["Filename", "Channel", "Rows", "Uploaded at"],
                rows=[
                    [d["filename"], d["channel"] or "Unknown", d["row_count"], d["uploaded_at"]]
                    for d in datasets
                ],
            )
        )
    else:
        sections.append(
            TextSection(
                "Uploaded datasets",
                "No upload history recorded yet — using the committed sample CSVs in data/.",
            )
        )

    # ── Channel coverage (from live frame) ─────────────────────────────────
    if df is not None and not getattr(df, "empty", True):
        channel_rows: list[list[Any]] = []
        for channel, group in df.groupby("channel", dropna=False):
            spend = float(group["spend"].fillna(0).sum())
            revenue = float(group["revenue"].fillna(0).sum())
            estimated_rows = (
                int(group["is_revenue_estimated"].fillna(False).sum())
                if "is_revenue_estimated" in group.columns
                else 0
            )
            channel_rows.append(
                [
                    str(channel),
                    int(len(group)),
                    int(group["campaign_id"].nunique()),
                    int(group["campaign_type"].nunique()) if "campaign_type" in group.columns else 0,
                    group["date"].min().date().isoformat(),
                    group["date"].max().date().isoformat(),
                    round(spend, 2),
                    round(revenue, 2),
                    round(revenue / spend, 3) if spend > 0 else 0.0,
                    estimated_rows,
                    round(estimated_rows / len(group) * 100, 1) if len(group) else 0.0,
                ]
            )
        channel_rows.sort(key=lambda r: r[6], reverse=True)
        sections.append(
            TableSection(
                title="Coverage by channel",
                columns=[
                    "Channel",
                    "Rows",
                    "Campaigns",
                    "Campaign types",
                    "Date from",
                    "Date to",
                    "Spend",
                    "Revenue",
                    "ROAS",
                    "Estimated revenue rows",
                    "% estimated",
                ],
                rows=channel_rows,
            )
        )

        type_rows: list[list[Any]] = []
        for (channel, ctype), group in df.groupby(["channel", "campaign_type"], dropna=False):
            spend = float(group["spend"].fillna(0).sum())
            revenue = float(group["revenue"].fillna(0).sum())
            type_rows.append(
                [
                    str(channel),
                    str(ctype),
                    int(len(group)),
                    int(group["campaign_id"].nunique()),
                    round(spend, 2),
                    round(revenue, 2),
                    round(revenue / spend, 3) if spend > 0 else 0.0,
                ]
            )
        type_rows.sort(key=lambda r: r[4], reverse=True)
        sections.append(
            TableSection(
                title="Coverage by campaign type",
                columns=["Channel", "Campaign type", "Rows", "Campaigns", "Spend", "Revenue", "ROAS"],
                rows=type_rows[:40],
            )
        )

        daily = (
            df.assign(_date=pd.to_datetime(df["date"]).dt.date)
            .groupby("_date", as_index=False)
            .agg(rows=("campaign_id", "count"), spend=("spend", "sum"), revenue=("revenue", "sum"))
            .sort_values("_date")
        )
        if len(daily):
            # Keep the report readable: first 7 + last 7 days when the range is long.
            preview = daily if len(daily) <= 21 else pd.concat([daily.head(10), daily.tail(10)])
            sections.append(
                TableSection(
                    title="Daily activity sample (first/last days)",
                    columns=["Date", "Rows", "Spend", "Revenue", "ROAS"],
                    rows=[
                        [
                            str(row["_date"]),
                            int(row["rows"]),
                            round(float(row["spend"]), 2),
                            round(float(row["revenue"]), 2),
                            round(float(row["revenue"]) / float(row["spend"]), 3)
                            if float(row["spend"]) > 0
                            else 0.0,
                        ]
                        for _, row in preview.iterrows()
                    ],
                )
            )

        top_spend = (
            df.groupby(["campaign_id", "campaign_name", "channel", "campaign_type"], as_index=False)
            .agg(spend=("spend", "sum"), revenue=("revenue", "sum"), rows=("date", "count"))
            .sort_values("spend", ascending=False)
            .head(15)
        )
        sections.append(
            TableSection(
                title="Top 15 campaigns by spend",
                columns=["Campaign ID", "Name", "Channel", "Type", "Rows", "Spend", "Revenue", "ROAS"],
                rows=[
                    [
                        str(row["campaign_id"]),
                        str(row["campaign_name"]),
                        str(row["channel"]),
                        str(row["campaign_type"]),
                        int(row["rows"]),
                        round(float(row["spend"]), 2),
                        round(float(row["revenue"]), 2),
                        round(float(row["revenue"]) / float(row["spend"]), 3)
                        if float(row["spend"]) > 0
                        else 0.0,
                    ]
                    for _, row in top_spend.iterrows()
                ],
            )
        )

    # ── Validation issues (full text + samples) ────────────────────────────
    if issues:
        sections.append(
            TableSection(
                title="Validation issues",
                columns=[
                    "Severity",
                    "Code",
                    "Message",
                    "Affected rows",
                    "% of total",
                    "Sample campaign IDs",
                ],
                rows=[
                    [
                        i.get("severity"),
                        i.get("code"),
                        i.get("message"),
                        i.get("affected_rows"),
                        round((int(i.get("affected_rows") or 0) / total_rows) * 100, 2) if total_rows else 0.0,
                        ", ".join(str(x) for x in (i.get("sample_campaign_ids") or [])[:8]) or "—",
                    ]
                    for i in issues
                ],
            )
        )
        action_lines = []
        for i in issues:
            sev = i.get("severity")
            code = i.get("code")
            if sev == "error":
                action_lines.append(f"• ERROR [{code}]: resolve before production use — {i.get('message')}")
            elif sev == "warning":
                action_lines.append(f"• WARNING [{code}]: review impact on forecasts — {i.get('message')}")
            else:
                action_lines.append(f"• INFO [{code}]: noted — {i.get('message')}")
        sections.append(TextSection("Recommended actions", "\n".join(action_lines)))
    else:
        sections.append(TextSection("Validation issues", "No data-quality issues found."))
        sections.append(
            TextSection(
                "Recommended actions",
                "• Data looks clean — safe to run forecasts and budget simulations.\n"
                "• Re-download this report after each new upload to keep an audit trail.",
            )
        )

    sections.append(
        TextSection(
            "Notes",
            "• Meta Ads revenue may be proxied from conversion value when a native revenue "
            "column is absent (flagged as estimated).\n"
            "• Google Ads cost is converted from micros to currency units during ingestion.\n"
            "• This report reflects the unified in-memory dataset after upload/normalize — "
            "not a raw per-file dump.",
        )
    )

    return ReportContent(title="Data Quality Report", generated_at=generated_at, sections=sections)
