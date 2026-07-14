import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/AppLayout";
import { ForecastChart } from "@/components/ForecastChart";
import { ForecastDistributionChart } from "@/components/ForecastDistributionChart";
import { DrillDownTabs } from "@/components/DrillDownTabs";
import { ChannelPerformanceTable } from "@/components/ChannelPerformanceTable";
import { CampaignTypeTable } from "@/components/CampaignTypeTable";
import { CampaignPerformanceTable } from "@/components/CampaignPerformanceTable";
import { useForecast } from "@/lib/forecast-context";
import { formatINR, formatMultiple, formatPct } from "@/lib/format";
import {
  TrendingUp, Target, ShieldCheck, Activity, BarChart2,
  ArrowUpRight, Layers, Cpu, AlertTriangle,
} from "lucide-react";
import { NetElixirLogo } from "@/components/PlatformLogos";

export const Route = createFileRoute("/forecasts")({
  head: () => ({
    meta: [
      { title: "Forecasts · ForecastIQ" },
      { name: "description", content: "Drill into aggregate, channel, campaign type, and campaign level forecasts." },
    ],
  }),
  component: ForecastsPage,
});

/* ── Small inline stat chip ─────────────────── */
function Chip({
  label, value, sub, icon, tone = "default",
}: {
  label: string; value: string; sub?: string;
  icon?: React.ReactNode; tone?: "default" | "primary" | "success" | "warning" | "error";
}) {
  const valueColor =
    tone === "primary" ? "text-primary" :
    tone === "success" ? "text-success" :
    tone === "warning" ? "text-warning" :
    tone === "error"   ? "text-error"   : "text-foreground";

  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-lg border border-border bg-panel-2/40 px-3.5 py-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon && <span className="text-primary/80 shrink-0">{icon}</span>}
        <span className="mono text-[9.5px] uppercase tracking-[0.16em] leading-none">{label}</span>
      </div>
      <div className={`mono text-[17px] font-semibold leading-none ${valueColor}`}>{value}</div>
      {sub && <div className="mono text-[9.5px] text-muted-foreground leading-snug">{sub}</div>}
    </div>
  );
}

function ForecastsPage() {
  const { state, forecast, loading } = useForecast();

  const p50  = forecast?.revenue.p50  ?? 0;
  const p10  = forecast?.revenue.p10  ?? 0;
  const p90  = forecast?.revenue.p90  ?? 0;
  const roas = forecast?.roas.p50     ?? 0;
  const conf = forecast?.confidence   ?? 0;
  const growth = forecast?.growth     ?? 0;
  const width  = p50 > 0 ? (p90 - p10) / p50 : 0;
  const marginalRoas = roas * 0.86;

  return (
    <PageContainer
      title="Forecasts"
      description="Probabilistic revenue projections across aggregate, channel, campaign type, and campaign levels."
    >
      {/* ── Hero model badge ──────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Live indicator */}
          <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${loading ? "bg-warning animate-pulse" : "bg-success animate-pulse"}`} />
            <span className="mono text-[10px] uppercase tracking-widest text-primary">
              {loading ? "Recomputing…" : "Live · Bayesian Ensemble"}
            </span>
          </div>
          {/* Model badge */}
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <NetElixirLogo size={12} />
            <span className="mono">ForecastIQ v4.2.1 · {forecast?.campaigns.length ?? "—"} campaigns</span>
          </div>
        </div>
        {/* Confidence pill */}
        <div className={`mono flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium
          ${conf > 0.85 ? "bg-success/10 text-success border border-success/20" : "bg-warning/10 text-warning border border-warning/20"}`}
        >
          <ShieldCheck className="h-3 w-3" />
          {forecast ? formatPct(conf, 0) : "—"} confidence
        </div>
      </div>

      {/* ── Primary headline number ───────────────── */}
      <div className="mb-4 rounded-xl border border-border bg-panel-2/30 px-5 py-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          {/* Big P50 number */}
          <div>
            <div className="mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Revenue Forecast · {forecast?.horizon ?? 0}-Day Horizon
            </div>
            <div
              className="mono mt-2 font-bold leading-none tracking-tight text-foreground"
              style={{ fontSize: "clamp(28px, 3.5vw, 46px)" }}
            >
              {forecast ? formatINR(p50) : "—"}
            </div>
            <div className="mono mt-1.5 text-[11.5px] text-muted-foreground">
              P50 median · range {forecast ? `${formatINR(p10)} – ${formatINR(p90)}` : "—"}
            </div>
          </div>

          {/* Stat chips strip */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Chip
              label="P10 (Pessimistic)"
              value={forecast ? formatINR(p10) : "—"}
              sub="lower bound"
              icon={<ArrowUpRight className="h-3 w-3 rotate-90" />}
            />
            <Chip
              label="P90 (Optimistic)"
              value={forecast ? formatINR(p90) : "—"}
              sub="upper bound"
              tone="primary"
              icon={<TrendingUp className="h-3 w-3" />}
            />
            <Chip
              label="Growth WoW"
              value={forecast ? formatPct(growth) : "—"}
              sub="week-on-week"
              tone={growth >= 0 ? "success" : "error"}
              icon={<Activity className="h-3 w-3" />}
            />
            <Chip
              label="Uncertainty"
              value={forecast ? formatPct(width, 0) : "—"}
              sub="P90−P10 / P50"
              tone={width < 0.3 ? "success" : "warning"}
              icon={width >= 0.3 ? <AlertTriangle className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
            />
          </div>
        </div>

        {/* Secondary KPI row */}
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3 sm:grid-cols-4">
          {[
            { label: "Blended ROAS",  value: forecast ? formatMultiple(roas)         : "—", sub: `${formatMultiple(forecast?.roas.p10 ?? 0)} – ${formatMultiple(forecast?.roas.p90 ?? 0)}`, icon: <Target className="h-3 w-3" />, tone: "default" as const },
            { label: "Marginal ROAS", value: forecast ? formatMultiple(marginalRoas)  : "—", sub: "next ₹1L spend", icon: <BarChart2 className="h-3 w-3" />, tone: "warning" as const },
            { label: "Campaigns",     value: forecast ? String(forecast.campaigns.length) : "—", sub: `${state.horizon}D horizon`, icon: <Layers className="h-3 w-3" />, tone: "default" as const },
            { label: "Model MAPE",    value: "6.6%", sub: "backtest 90D", icon: <Cpu className="h-3 w-3" />, tone: "success" as const },
          ].map((c) => (
            <Chip key={c.label} {...c} />
          ))}
        </div>
      </div>

      {/* ── Chart + drill-down panel ─────────────── */}
      <div className="panel overflow-hidden">
        <DrillDownTabs />
        <div className="p-4">
          <ForecastChart />
        </div>
        <div className={`p-4 pt-0 ${state.level === "aggregate" ? "grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]" : ""}`}>
          {state.level === "channel" ? (
            <ChannelPerformanceTable />
          ) : state.level === "campaignType" ? (
            <CampaignTypeTable />
          ) : state.level === "campaign" ? (
            <CampaignPerformanceTable />
          ) : (
            <>
              {/* Aggregate: distribution chart takes left, quick summary right */}
              <ForecastDistributionChart />
              <div className="flex flex-col gap-3">
                {/* Probability summary */}
                <div className="rounded-lg border border-border bg-panel-2/30 p-4">
                  <div className="mono mb-3 text-[9.5px] uppercase tracking-[0.18em] text-primary">
                    Interval Summary
                  </div>
                  {[
                    { label: "P10",  value: forecast ? formatINR(p10) : "—", pct: "10% probability below" },
                    { label: "P50",  value: forecast ? formatINR(p50) : "—", pct: "Median estimate", highlight: true },
                    { label: "P90",  value: forecast ? formatINR(p90) : "—", pct: "90% probability below" },
                    { label: "Range",value: forecast ? formatINR(p90 - p10) : "—", pct: "P90 − P10 spread" },
                  ].map((r) => (
                    <div key={r.label} className={`flex items-center justify-between py-2 ${r.highlight ? "border-y border-border" : ""}`}>
                      <div>
                        <span className={`mono text-[11px] font-semibold ${r.highlight ? "text-primary" : "text-foreground"}`}>
                          {r.label}
                        </span>
                        <div className="mono text-[9.5px] text-muted-foreground">{r.pct}</div>
                      </div>
                      <span className={`mono text-[13px] font-semibold ${r.highlight ? "text-primary" : "text-foreground"}`}>
                        {r.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* ROAS box */}
                <div className="rounded-lg border border-border bg-panel-2/30 p-4">
                  <div className="mono mb-2 text-[9.5px] uppercase tracking-[0.18em] text-primary">
                    ROAS Distribution
                  </div>
                  {[
                    { k: "P10", v: forecast?.roas.p10 ?? 0 },
                    { k: "P50", v: forecast?.roas.p50 ?? 0 },
                    { k: "P90", v: forecast?.roas.p90 ?? 0 },
                  ].map((r) => (
                    <div key={r.k} className="flex items-center gap-2 py-1">
                      <span className="mono w-6 text-[10px] text-muted-foreground">{r.k}</span>
                      <div className="flex-1 rounded-full bg-panel-2 h-1.5">
                        <div
                          className="h-full rounded-full gradient-primary opacity-80"
                          style={{ width: `${Math.min(100, (r.v / ((forecast?.roas.p90 ?? 1) * 1.1)) * 100)}%` }}
                        />
                      </div>
                      <span className="mono w-10 text-right text-[11px] font-semibold text-foreground">
                        {formatMultiple(r.v)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
