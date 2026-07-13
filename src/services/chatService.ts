// Mock AI service for the ForecastIQ Assistant.
// All responses are deterministic-ish canned business explanations.

import type { ForecastResult, Insights, BudgetAllocation } from "@/lib/forecast";
import { formatINR, formatMultiple, formatPct } from "@/lib/format";

export type MessageKind =
  | "user"
  | "assistant"
  | "system"
  | "risk"
  | "recommendation"
  | "forecast-summary"
  | "budget-optimization";

export interface ChatCitation {
  label: string;
  source: string;
  detail?: string;
}

export interface AssistantPayload {
  kind: MessageKind;
  markdown: string;
  citations?: ChatCitation[];
  reasoning?: { title: string; drivers: { label: string; value: string; weight: number }[] };
  risks?: { label: string; severity: "low" | "medium" | "high"; note: string }[];
  budget?: { channel: string; current: number; proposed: number; delta: number; rationale: string }[];
}

export interface ForecastContext {
  budget: BudgetAllocation;
  forecast: ForecastResult | null;
  insights: Insights | null;
  horizon: number;
  level: string;
  channel: string;
}

function pickIntent(prompt: string): MessageKind {
  const p = prompt.toLowerCase();
  if (/(risk|anomal|warning|threat|danger)/.test(p)) return "risk";
  if (/(optimi|reallocat|rebalanc|shift|move.*budget|increase.*budget)/.test(p)) return "budget-optimization";
  if (/(recommend|suggest|advice|should i)/.test(p)) return "recommendation";
  if (/(explain|summary|summariz|why|forecast|projection|reveneue|revenue|roas|confidence)/.test(p))
    return "forecast-summary";
  return "assistant";
}

function driverList(ctx: ForecastContext) {
  const total = ctx.budget.google + ctx.budget.meta + ctx.budget.microsoft || 1;
  return [
    { label: "Google Ads mix", value: `${((ctx.budget.google / total) * 100).toFixed(1)}%`, weight: ctx.budget.google / total },
    { label: "Meta Ads mix", value: `${((ctx.budget.meta / total) * 100).toFixed(1)}%`, weight: ctx.budget.meta / total },
    { label: "Microsoft mix", value: `${((ctx.budget.microsoft / total) * 100).toFixed(1)}%`, weight: ctx.budget.microsoft / total },
    { label: "Horizon", value: `${ctx.horizon} days`, weight: Math.min(ctx.horizon / 90, 1) },
  ];
}

function forecastSummaryMarkdown(ctx: ForecastContext) {
  const f = ctx.forecast;
  if (!f) return "Forecast has not finished computing yet. Try again in a moment.";
  const growthPct = (f.growth * 100).toFixed(1);
  const conf = (f.confidence * 100).toFixed(0);
  return `## Forecast summary — next ${f.horizon} days

Projected **revenue** is **${formatINR(f.revenue.p50)}** at the P50 median, with a P10–P90 band of **${formatINR(f.revenue.p10)} – ${formatINR(f.revenue.p90)}**. Blended ROAS lands near **${formatMultiple(f.roas.p50)}** and posterior confidence sits at **${conf}%**.

Growth is trending **${growthPct}%** week-over-week, driven primarily by stronger historical Search performance and improving conversion rates on higher-intent traffic.

| Metric | P10 | P50 | P90 |
| --- | --- | --- | --- |
| Revenue | ${formatINR(f.revenue.p10)} | ${formatINR(f.revenue.p50)} | ${formatINR(f.revenue.p90)} |
| ROAS | ${formatMultiple(f.roas.p10)} | ${formatMultiple(f.roas.p50)} | ${formatMultiple(f.roas.p90)} |

- Search continues to be the dominant contributor to expected revenue.
- Meta efficiency has softened due to recent conversion-rate compression.
- Microsoft Ads shows steady incremental lift within its budget envelope.`;
}

function riskMarkdown(ctx: ForecastContext) {
  const f = ctx.forecast;
  return `## Risk assessment

The current allocation shows a few risk flags worth surfacing before more budget is committed.

- **Budget concentration** is heavily weighted toward Search, reducing diversification.
- **Attribution quality** for Meta declined during the last reporting period.
- **Data hygiene**: two campaigns contain inconsistent UTM tagging.
${f && f.confidence < 0.85 ? "- **Posterior confidence** is below 85%, meaning the P10–P90 range is wider than usual." : ""}

Suggested action: address UTM tagging first, then rebalance ~8–12% of Display budget toward Search.`;
}

function recommendationMarkdown(ctx: ForecastContext) {
  const total = ctx.budget.google + ctx.budget.meta + ctx.budget.microsoft;
  return `## Recommendations

Based on the current forecast and channel efficiency, the assistant recommends:

1. **Shift ~10% of Display spend into Search** — expected ROAS lift is 4–6%.
2. **Hold Meta budget flat** until attribution quality recovers for two consecutive weeks.
3. **Increase Microsoft Ads** by ~5% to capture incremental non-cannibalising demand.

Current committed spend: **${formatINR(total)}** across three channels.`;
}

function budgetMarkdown(ctx: ForecastContext) {
  return `## Budget optimization

Reallocation plan derived from current elasticity estimates and channel-level ROAS forecast.

The proposed mix is designed to protect the P50 revenue projection while narrowing the P10–P90 band by roughly **3 percentage points** of confidence.`;
}

const CANNED = [
  "The current forecast is meaningfully sensitive to Search efficiency — a 5% ROAS improvement there flows through as ~2.1% of blended revenue.",
  "Seasonality is expected to add a modest tailwind in the second half of the horizon; the model has already priced in ~1.4% of that lift.",
  "Anomaly detection did not flag any severe outliers in the last 14 days, though Meta CTR is drifting slightly below its 90-day mean.",
];

export async function generateResponse(prompt: string, ctx: ForecastContext): Promise<AssistantPayload> {
  const delay = 1200 + Math.random() * 600;
  await new Promise((r) => setTimeout(r, delay));

  const kind = pickIntent(prompt);
  const f = ctx.forecast;

  const baseCitations: ChatCitation[] = [
    { label: "Forecast run", source: `Model v4.2.1 · ${ctx.horizon}D horizon`, detail: "Bayesian hierarchical ensemble" },
    { label: "Dataset", source: "acme_retail_2024_06", detail: `${f?.campaigns.length ?? 0} campaigns · 1,238 rows` },
  ];

  if (kind === "forecast-summary") {
    return {
      kind,
      markdown: forecastSummaryMarkdown(ctx),
      citations: baseCitations,
      reasoning: { title: "Top drivers", drivers: driverList(ctx) },
    };
  }
  if (kind === "risk") {
    return {
      kind,
      markdown: riskMarkdown(ctx),
      citations: baseCitations,
      risks: [
        { label: "Budget concentration", severity: "high", note: "Search accounts for the majority of projected revenue." },
        { label: "Meta attribution quality", severity: "medium", note: "Signal fidelity has decayed for 2 weeks." },
        { label: "UTM hygiene", severity: "low", note: "2 campaigns emit inconsistent UTM tags." },
      ],
    };
  }
  if (kind === "budget-optimization") {
    const b = ctx.budget;
    return {
      kind,
      markdown: budgetMarkdown(ctx),
      citations: baseCitations,
      budget: [
        { channel: "Google Ads", current: b.google, proposed: Math.round(b.google * 1.08), delta: 0.08, rationale: "Highest expected marginal ROAS." },
        { channel: "Meta Ads", current: b.meta, proposed: Math.round(b.meta * 0.94), delta: -0.06, rationale: "Attribution quality softening; hold back until stable." },
        { channel: "Microsoft Ads", current: b.microsoft, proposed: Math.round(b.microsoft * 1.05), delta: 0.05, rationale: "Incremental non-cannibalising demand." },
      ],
    };
  }
  if (kind === "recommendation") {
    return { kind, markdown: recommendationMarkdown(ctx), citations: baseCitations };
  }
  return {
    kind: "assistant",
    markdown: `${CANNED[Math.floor(Math.random() * CANNED.length)]}\n\nAsk a more specific question — e.g. *"Why is ROAS decreasing?"* or *"Optimize my budget"* — for a structured answer with citations.`,
    citations: baseCitations,
  };
}

export const SUGGESTED_QUESTIONS = [
  "Explain this forecast",
  "Optimize my budget",
  "Why is ROAS decreasing?",
  "What are the biggest risks?",
  "Show campaign insights",
  "Find anomalies",
  "Increase revenue",
  "Improve confidence",
  "Generate executive summary",
  "Best performing channel",
  "Worst performing campaign",
  "Seasonality impact",
];
