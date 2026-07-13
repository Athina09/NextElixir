import { createFileRoute } from "@tanstack/react-router";
import { RefreshCw, Download } from "lucide-react";
import { ForecastHero } from "@/components/dashboard/ForecastHero";
import { MetricStrip } from "@/components/dashboard/MetricStrip";
import { BudgetConsole } from "@/components/dashboard/BudgetConsole";
import { AnalystReport } from "@/components/dashboard/AnalystReport";
import { ChannelPerformanceTable } from "@/components/ChannelPerformanceTable";
import { useForecast } from "@/lib/forecast-context";
import {
  formatINR,
  formatMultiple,
  formatPct,
  formatNumber,
} from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · ForecastIQ" },
      {
        name: "description",
        content:
          "Probabilistic revenue and ROAS forecasts, insights, and drill-down analytics.",
      },
    ],
  }),
  component: DashboardPage,
});

function SectionHead({
  eyebrow,
  title,
  right,
}: {
  eyebrow: string;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <div className="mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          {eyebrow}
        </div>
        <div className="mt-1 text-[15px] font-semibold tracking-tight">
          {title}
        </div>
      </div>
      {right}
    </div>
  );
}

function DashboardPage() {
  const { forecast, refresh } = useForecast();

  return (
    <div className="w-full">
      {/* Slim page header — no card, hairline only */}
      <div className="hairline-b">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-6">
          <div className="min-w-0">
            <div className="mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              ForecastIQ · Workstation
            </div>
            <h1 className="mt-1 text-[18px] font-semibold tracking-tight">
              Forecast Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              className="mono flex items-center gap-1.5 border border-[color:var(--border)] px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:border-primary/40"
            >
              <RefreshCw className="h-3 w-3" /> Re-run model
            </button>
            <button className="mono flex items-center gap-1.5 bg-primary px-3 py-1.5 text-[11px] font-medium text-primary-foreground hover:bg-primary/90">
              <Download className="h-3 w-3" /> Export report
            </button>
          </div>
        </div>
      </div>

      {/* HERO — the forecast is the product */}
      <div className="mx-auto max-w-[1600px] px-4 md:px-6">
        <ForecastHero />
      </div>

      {/* Compact KPI strip — inline, no cards */}
      <div className="mx-auto max-w-[1600px] px-4 md:px-6">
        <MetricStrip
          stats={[
            {
              label: "Revenue P50",
              value: forecast ? formatINR(forecast.revenue.p50) : "—",
              sub: forecast
                ? `${formatINR(forecast.revenue.p10)}–${formatINR(forecast.revenue.p90)}`
                : "",
              tone: "primary",
              emphasis: true,
            },
            {
              label: "ROAS",
              value: forecast ? formatMultiple(forecast.roas.p50) : "—",
              delta: 0.062,
              sub: "blended",
            },
            {
              label: "Growth",
              value: forecast ? formatPct(forecast.growth) : "—",
              delta: forecast?.growth,
              sub: "wow",
            },
            {
              label: "Confidence",
              value: forecast ? formatPct(forecast.confidence, 0) : "—",
              tone:
                forecast && forecast.confidence > 0.85 ? "primary" : "warning",
              sub: "90% CI",
            },
            {
              label: "Campaigns",
              value: forecast ? formatNumber(forecast.campaigns.length) : "—",
              sub: "in horizon",
            },
            {
              label: "Model MAPE",
              value: "6.6%",
              sub: "backtest 90D · v4.2.1",
            },
          ]}
        />
      </div>

      {/* Console + Analyst report — asymmetric split, no cards */}
      <div className="mx-auto max-w-[1600px] px-4 pt-10 md:px-6 md:pt-14">
        <div className="grid gap-12 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <BudgetConsole />
          <AnalystReport />
        </div>
      </div>

      {/* Channel table — borderless, professional analytics */}
      <div className="mx-auto max-w-[1600px] px-4 pt-10 md:px-6 md:pt-14 pb-10">
        <SectionHead
          eyebrow="Channel intelligence"
          title="Performance by channel"
        />
        <ChannelPerformanceTable />
      </div>
    </div>
  );
}
