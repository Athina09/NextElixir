import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/AppLayout";
import { MetricCard } from "@/components/MetricCard";
import { ForecastChart } from "@/components/ForecastChart";
import { ForecastDistributionChart } from "@/components/ForecastDistributionChart";
import { BudgetSimulator } from "@/components/BudgetSimulator";
import { InsightsPanel } from "@/components/InsightsPanel";
import { ChannelPerformanceTable } from "@/components/ChannelPerformanceTable";
import { BudgetAllocationPie } from "@/components/BudgetAllocationPie";
import { useForecast } from "@/lib/forecast-context";
import { formatINR, formatMultiple, formatPct, formatNumber } from "@/lib/format";
import { RefreshCw, Download } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · ForecastIQ" },
      { name: "description", content: "Probabilistic revenue and ROAS forecasts, insights, and drill-down analytics." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { forecast, loading, refresh } = useForecast();
  const revenueSpark = forecast?.timeline.slice(-24).map((p) => p.p50) ?? [];
  const roasSpark = forecast?.timeline.slice(-24).map((p) => p.roas) ?? [];

  return (
    <PageContainer
      title="Forecast Dashboard"
      description="Probabilistic revenue and ROAS projections across your active media budget."
      actions={
        <>
          <button
            onClick={refresh}
            className="mono hairline-b flex items-center gap-1.5 rounded-sm bg-panel-2/60 px-2.5 py-1.5 text-[11px] hover:bg-panel-2"
          >
            <RefreshCw className="h-3 w-3" /> Re-run
          </button>
          <button className="mono flex items-center gap-1.5 rounded-sm bg-primary px-2.5 py-1.5 text-[11px] font-medium text-primary-foreground hover:bg-primary/90">
            <Download className="h-3 w-3" /> Export report
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <MetricCard
          label="Forecast revenue"
          value={forecast ? formatINR(forecast.revenue.p50) : "—"}
          sub={forecast ? `${formatINR(forecast.revenue.p10)} – ${formatINR(forecast.revenue.p90)}` : ""}
          delta={forecast?.growth}
          spark={revenueSpark}
          loading={loading && !forecast}
          hint="P50"
          tone="primary"
        />
        <MetricCard
          label="Forecast ROAS"
          value={forecast ? formatMultiple(forecast.roas.p50) : "—"}
          sub={forecast ? `${formatMultiple(forecast.roas.p10)} – ${formatMultiple(forecast.roas.p90)}` : ""}
          delta={0.062}
          spark={roasSpark}
          hint="blended"
        />
        <MetricCard
          label="Expected growth"
          value={forecast ? formatPct(forecast.growth) : "—"}
          sub="week-over-week"
          delta={forecast?.growth}
          hint={`${forecast?.horizon ?? 0}D`}
        />
        <MetricCard
          label="Prediction confidence"
          value={forecast ? formatPct(forecast.confidence, 0) : "—"}
          sub="posterior interval width"
          hint="90% CI"
          tone={forecast && forecast.confidence > 0.85 ? "primary" : "warning"}
        />
        <MetricCard
          label="Campaigns"
          value={forecast ? formatNumber(forecast.campaigns.length) : "—"}
          sub="in active horizon"
          hint="live"
        />
        <MetricCard
          label="Average spend"
          value={forecast ? formatINR(forecast.totalBudget / Math.max(forecast.campaigns.length, 1)) : "—"}
          sub="per campaign"
          hint="mean"
        />
        <MetricCard
          label="Model accuracy"
          value="93.4%"
          sub="MAPE 6.6 · backtested 90D"
          hint="v4.2.1"
          tone="primary"
        />
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <ForecastChart />
        <BudgetSimulator />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChannelPerformanceTable />
        </div>
        <BudgetAllocationPie />
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <ForecastDistributionChart />
        <InsightsPanel />
      </div>
    </PageContainer>
  );
}
