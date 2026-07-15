import { createFileRoute } from "@tanstack/react-router";
import { RefreshCw, Download, TrendingUp, Target, ArrowUpRight, ShieldCheck, Layers, Cpu } from "lucide-react";
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
    <div className="mb-4 flex items-end justify-between gap-4">
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
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 pb-24 md:px-6 md:pb-24">
      {/* Page header */}
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="mono whitespace-nowrap text-[10px] uppercase tracking-[0.22em] text-gradient-primary">
            ForecastIQ · Workstation
          </div>
          <h1 className="mt-1 truncate text-[20px] font-semibold tracking-tight">
            Forecast Dashboard
          </h1>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            onClick={refresh}
            className="mono flex items-center gap-1.5 rounded-md border border-[color:var(--border)] bg-panel-2/40 px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <RefreshCw className="h-3 w-3" /> Re-run model
          </button>
          <button className="mono flex items-center gap-1.5 rounded-md gradient-primary px-3 py-1.5 text-[11px] font-medium text-primary-foreground shadow-md transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
            <Download className="h-3 w-3" /> Export report
          </button>
        </div>
      </header>

      {/* Rows separated by consistent 24px rhythm */}
      <div className="space-y-6">
        {/* KPI strip — one baseline, equal cells */}
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
              icon: <TrendingUp className="h-3 w-3" />,
            },
            {
              label: "ROAS",
              value: forecast ? formatMultiple(forecast.roas.p50) : "—",
              delta: 0.062,
              sub: "blended",
              icon: <Target className="h-3 w-3" />,
            },
            {
              label: "Growth",
              value: forecast ? formatPct(forecast.growth) : "—",
              delta: forecast?.growth,
              sub: "wow",
              icon: <ArrowUpRight className="h-3 w-3" />,
            },
            {
              label: "Confidence",
              value: forecast ? formatPct(forecast.confidence, 0) : "—",
              tone:
                forecast && forecast.confidence > 0.85 ? "primary" : "warning",
              sub: "90% CI",
              icon: <ShieldCheck className="h-3 w-3" />,
            },
            {
              label: "Campaigns",
              value: forecast ? formatNumber(forecast.campaigns.length) : "—",
              sub: "in horizon",
              icon: <Layers className="h-3 w-3" />,
            },
            {
              label: "Model MAPE",
              value: "6.6%",
              sub: "backtest 90D · v4.2.1",
              icon: <Cpu className="h-3 w-3" />,
            },
          ]}
        />

        {/* Hero row — 12-col grid, chart 8 / budget 4, equal heights */}
        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <ForecastHero />
          </div>
          <div className="lg:col-span-4">
            <BudgetConsole />
          </div>
        </div>

        {/* AI analyst report */}
        <AnalystReport />

        {/* Channel table */}
        <section>
          <SectionHead
            eyebrow="Channel intelligence"
            title="Performance by channel"
          />
          <div className="panel-elevated overflow-hidden">
            <ChannelPerformanceTable />
          </div>
        </section>
      </div>
    </div>
  );
}
