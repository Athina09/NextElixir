import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/AppLayout";
import { ForecastChart } from "@/components/ForecastChart";
import { ForecastDistributionChart } from "@/components/ForecastDistributionChart";
import { DrillDownTabs } from "@/components/DrillDownTabs";
import { ChannelPerformanceTable } from "@/components/ChannelPerformanceTable";
import { CampaignTypeTable } from "@/components/CampaignTypeTable";
import { CampaignPerformanceTable } from "@/components/CampaignPerformanceTable";
import { MetricCard } from "@/components/MetricCard";
import { useForecast } from "@/lib/forecast-context";
import { formatINR, formatMultiple, formatPct } from "@/lib/format";

export const Route = createFileRoute("/forecasts")({
  head: () => ({
    meta: [
      { title: "Forecasts · ForecastIQ" },
      { name: "description", content: "Drill into aggregate, channel, campaign type, and campaign level forecasts." },
    ],
  }),
  component: ForecastsPage,
});

function ForecastsPage() {
  const { state, forecast } = useForecast();
  return (
    <PageContainer
      title="Forecasts"
      description="Explore probabilistic projections across aggregate, channel, campaign type, and campaign levels."
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard
          label="P50 Revenue"
          value={forecast ? formatINR(forecast.revenue.p50) : "—"}
          sub={forecast ? `P10 ${formatINR(forecast.revenue.p10)}` : ""}
          tone="primary"
          hint="median"
        />
        <MetricCard
          label="P90 Revenue"
          value={forecast ? formatINR(forecast.revenue.p90) : "—"}
          sub="upper bound · optimistic"
          hint="P90"
        />
        <MetricCard
          label="ROAS median"
          value={forecast ? formatMultiple(forecast.roas.p50) : "—"}
          sub={forecast ? `${formatMultiple(forecast.roas.p10)} – ${formatMultiple(forecast.roas.p90)}` : ""}
          hint="blended"
        />
        <MetricCard
          label="Uncertainty width"
          value={
            forecast
              ? formatPct(
                  (forecast.revenue.p90 - forecast.revenue.p10) / Math.max(forecast.revenue.p50, 1),
                  0,
                )
              : "—"
          }
          sub="P90 − P10 relative to P50"
          hint="tighter is better"
          tone="warning"
        />
      </div>

      <div className="panel mt-3">
        <DrillDownTabs />
        <div className="p-3">
          <ForecastChart />
        </div>
        <div className="p-3 pt-0">
          {state.level === "channel" ? (
            <ChannelPerformanceTable />
          ) : state.level === "campaignType" ? (
            <CampaignTypeTable />
          ) : state.level === "campaign" ? (
            <CampaignPerformanceTable />
          ) : (
            <ForecastDistributionChart />
          )}
        </div>
      </div>
    </PageContainer>
  );
}
