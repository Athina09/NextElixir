import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/AppLayout";
import { ForecastChart } from "@/components/ForecastChart";
import { BudgetAllocationPie } from "@/components/BudgetAllocationPie";
import { useForecast } from "@/lib/forecast-context";
import { formatINR, formatMultiple, formatPct } from "@/lib/format";
import { Sparkles, TrendingUp, Target, ShieldCheck, BarChart2, Minus, Plus } from "lucide-react";
import { Link as RouterLink } from "@tanstack/react-router";
import { ChannelLogo } from "@/components/PlatformLogos";
import { motion } from "framer-motion";
import type { Horizon } from "@/lib/forecast";

export const Route = createFileRoute("/budget-simulator")({
  head: () => ({
    meta: [
      { title: "Budget Simulator · ForecastIQ" },
      { name: "description", content: "Simulate media budget allocations and observe probabilistic revenue impact in real time." },
    ],
  }),
  component: BudgetSimulatorPage,
});

const MAX = 5_000_000;
const HORIZONS: Horizon[] = [30, 60, 90];
const ROWS = [
  { key: "google" as const, label: "Google Ads", hint: "Search · Shopping · PMax", color: "#4285F4" },
  { key: "meta" as const, label: "Meta Ads", hint: "Facebook · Instagram · Reels", color: "#1877F2" },
  { key: "microsoft" as const, label: "Microsoft Ads", hint: "Bing · LinkedIn audience", color: "#00A4EF" },
];

function KPI({ label, value, sub, icon, tone = "default" }: {
  label: string; value: string; sub?: string; icon: React.ReactNode;
  tone?: "default" | "primary" | "warning";
}) {
  const valueColor = tone === "primary" ? "text-primary" : tone === "warning" ? "text-warning" : "text-foreground";
  return (
    <div className="panel flex min-w-0 flex-col gap-1.5 p-4">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <span className="text-primary/80">{icon}</span>
        <span className="mono text-[9.5px] uppercase tracking-[0.16em]">{label}</span>
      </div>
      <div className={`mono text-[20px] font-semibold leading-none ${valueColor}`}>{value}</div>
      {sub && <div className="mono text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function BudgetSimulatorPage() {
  const { forecast, state, dispatch, loading, insights, insightsLoading } = useForecast();
  const total = state.budget.google + state.budget.meta + state.budget.microsoft;
  const revenueP50 = forecast?.revenue.p50 ?? 0;

  return (
    <PageContainer
      title="Budget Simulator"
      description="Adjust channel budgets and forecast horizon — KPIs, chart, and AI insights update in real time."
    >
      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">

        {/* ── LEFT: Sliders ───────────────────────────── */}
        <div className="panel flex flex-col gap-0 overflow-hidden">
          {/* Header */}
          <div className="hairline-b flex items-center justify-between px-4 py-3">
            <div>
              <div className="mono text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground">Budget Console</div>
              <div className="mt-0.5 text-[13px] font-semibold tracking-tight">Media Allocation</div>
            </div>
            <div className="text-right">
              <div className="mono text-[9px] uppercase tracking-widest text-muted-foreground">Total</div>
              <div className="mono text-[17px] font-semibold text-primary">{formatINR(total)}</div>
            </div>
          </div>

          {/* Horizon tabs */}
          <div className="hairline-b flex items-center gap-1 px-4 py-2.5">
            <span className="mono mr-2 text-[9.5px] uppercase tracking-widest text-muted-foreground">Horizon</span>
            {HORIZONS.map((h) => (
              <button
                key={h}
                onClick={() => dispatch({ type: "SET_HORIZON", payload: h })}
                className={`mono rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${state.horizon === h
                    ? "gradient-primary text-primary-foreground"
                    : "bg-panel-2/60 text-muted-foreground hover:text-foreground"
                  }`}
              >
                {h}D
              </button>
            ))}
            {loading && (
              <span className="mono ml-auto animate-pulse text-[10px] text-warning">recomputing…</span>
            )}
          </div>

          {/* Channel sliders */}
          <div className="flex flex-col gap-3 px-4 py-4">
            {ROWS.map((row) => {
              const value = state.budget[row.key];
              const pct = total > 0 ? (value / total) * 100 : 0;
              const projected = revenueP50 * (total > 0 ? value / total : 0);
              return (
                <div key={row.key} className="rounded-lg border border-border bg-panel-2/30 p-3">
                  {/* Row header */}
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ChannelLogo channel={row.label} size={16} className="shrink-0" />
                      <div>
                        <div className="text-[12px] font-medium">{row.label}</div>
                        <div className="mono text-[9.5px] text-muted-foreground">{row.hint}</div>
                      </div>
                    </div>
                    {/* ±50k buttons + input */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => dispatch({ type: "SET_BUDGET", payload: { [row.key]: Math.max(0, value - 50_000) } as any })}
                        className="flex h-6 w-6 items-center justify-center rounded-md bg-panel-2 text-muted-foreground hover:text-foreground"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="mono min-w-[72px] text-center text-[12px] font-semibold text-foreground">
                        {formatINR(value)}
                      </span>
                      <button
                        onClick={() => dispatch({ type: "SET_BUDGET", payload: { [row.key]: Math.min(MAX, value + 50_000) } as any })}
                        className="flex h-6 w-6 items-center justify-center rounded-md bg-panel-2 text-muted-foreground hover:text-foreground"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* Slider */}
                  <input
                    type="range"
                    min={0}
                    max={MAX}
                    step={10_000}
                    value={value}
                    onChange={(e) => dispatch({ type: "SET_BUDGET", payload: { [row.key]: Number(e.target.value) } as any })}
                    className="range-forecast h-[3px] w-full cursor-pointer appearance-none rounded-full bg-panel-2 accent-primary"
                  />

                  {/* Allocation bar + projected */}
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex flex-1 items-center gap-2">
                      <div className="flex-1 rounded-full bg-panel-2 h-1">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: row.color }}
                        />
                      </div>
                      <span className="mono w-7 text-right text-[9.5px] text-muted-foreground">{pct.toFixed(0)}%</span>
                    </div>
                    <span className="mono text-[9.5px] text-primary">≈ {formatINR(projected)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ask AI CTA */}
          <div className="hairline-t p-4 pb-0">
            <RouterLink
              to="/ai-assistant"
              className="mono flex items-center justify-center gap-2 rounded-lg gradient-primary py-2.5 text-[11px] font-medium uppercase tracking-widest text-primary-foreground shadow-md transition-opacity hover:opacity-90"
            >
              <Sparkles className="h-3 w-3" /> Ask AI to optimize
            </RouterLink>
          </div>

          {/* Live forecast summary — fills empty space below CTA */}
          <div className="p-4 pt-3">
            <div className="mono mb-2 text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
              Forecast Summary
            </div>
            <div className="space-y-0 rounded-lg border border-border overflow-hidden">
              {[
                {
                  label: "Blended ROAS",
                  value: forecast ? formatMultiple(forecast.roas.p50) : "—",
                  sub: forecast ? `${formatMultiple(forecast.roas.p10)} – ${formatMultiple(forecast.roas.p90)}` : "",
                  accent: false,
                },
                {
                  label: "Marginal ROAS",
                  value: forecast ? formatMultiple(forecast.roas.p50 * 0.86) : "—",
                  sub: "next ₹1L spend",
                  accent: false,
                },
                {
                  label: "Confidence",
                  value: forecast ? formatPct(forecast.confidence, 0) : "—",
                  sub: "posterior interval",
                  accent: forecast ? forecast.confidence > 0.85 : false,
                },
                {
                  label: "Growth WoW",
                  value: forecast ? formatPct(forecast.growth) : "—",
                  sub: "week-on-week",
                  accent: false,
                },
              ].map((row, i, arr) => (
                <div
                  key={row.label}
                  className={`flex items-center justify-between px-3 py-2 bg-panel-2/30 ${i < arr.length - 1 ? "hairline-b" : ""}`}
                >
                  <span className="mono text-[10px] text-muted-foreground">{row.label}</span>
                  <div className="text-right">
                    <div className={`mono text-[12px] font-semibold ${row.accent ? "text-primary" : "text-foreground"}`}>
                      {row.value}
                    </div>
                    {row.sub && (
                      <div className="mono text-[9px] text-muted-foreground">{row.sub}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: KPIs + Chart + Insights ─────────── */}
        <div className="flex min-w-0 flex-col gap-4">

          {/* KPI strip */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <KPI
              label="Total Spend"
              value={forecast ? formatINR(forecast.totalBudget) : "—"}
              sub="current allocation"
              tone="primary"
              icon={<BarChart2 className="h-3 w-3" />}
            />
            <KPI
              label="Revenue P50"
              value={forecast ? formatINR(forecast.revenue.p50) : "—"}
              sub={forecast ? `${formatINR(forecast.revenue.p10)} – ${formatINR(forecast.revenue.p90)}` : ""}
              icon={<TrendingUp className="h-3 w-3" />}
            />
            <KPI
              label="Blended ROAS"
              value={forecast ? formatMultiple(forecast.roas.p50) : "—"}
              sub={forecast ? `${formatMultiple(forecast.roas.p10)} – ${formatMultiple(forecast.roas.p90)}` : ""}
              icon={<Target className="h-3 w-3" />}
            />
            <KPI
              label="Confidence"
              value={forecast ? formatPct(forecast.confidence, 0) : "—"}
              sub="posterior interval"
              tone={forecast && forecast.confidence > 0.85 ? "primary" : "warning"}
              icon={<ShieldCheck className="h-3 w-3" />}
            />
          </div>

          {/* Forecast chart */}
          <ForecastChart />

          {/* Allocation pie + AI Insights side-by-side */}
          <div className="grid gap-4 lg:grid-cols-2">
            <BudgetAllocationPie />

            {/* Inline AI Insights — condensed */}
            <div className="panel relative overflow-hidden">
              <div className="absolute inset-y-0 left-0 w-[3px] gradient-primary" />
              <div className="hairline-b flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-sm gradient-primary text-primary-foreground">
                    <Sparkles className="h-2.5 w-2.5" strokeWidth={2.5} />
                  </div>
                  <span className="text-[11px] font-semibold">AI Insights</span>
                </div>
                <span className={`mono flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] ${insightsLoading ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
                  }`}>
                  <Sparkles className="h-2.5 w-2.5" />
                  {insightsLoading ? "reasoning…" : "ready"}
                </span>
              </div>

              <div className="min-h-[120px] p-4">
                {insightsLoading || !insights ? (
                  <div className="mono space-y-1.5 text-[11.5px] text-muted-foreground">
                    <div className="animate-pulse">› Sampling posterior distribution…</div>
                    <div className="animate-pulse" style={{ animationDelay: "0.15s" }}>› Scoring drivers via SHAP…</div>
                    <div className="animate-pulse" style={{ animationDelay: "0.3s" }}>› Compiling narrative…</div>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3 text-[12px] leading-relaxed"
                  >
                    <p className="text-foreground">{insights.summary}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="mono mb-1 text-[9.5px] uppercase tracking-widest text-success">Positives</div>
                        <ul className="space-y-0.5">
                          {insights.positives.slice(0, 2).map((p) => (
                            <li key={p} className="flex gap-1.5 text-[11.5px] text-muted-foreground">
                              <span className="text-success shrink-0">+</span>{p}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="mono mb-1 text-[9.5px] uppercase tracking-widest text-warning">Watch</div>
                        <ul className="space-y-0.5">
                          {insights.flags.slice(0, 2).map((f) => (
                            <li key={f} className="flex gap-1.5 text-[11.5px] text-muted-foreground">
                              <span className="text-warning shrink-0">!</span>{f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    {insights.recommendations[0] && (
                      <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-[11.5px]">
                        <span className="mono text-primary">→ </span>{insights.recommendations[0]}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
