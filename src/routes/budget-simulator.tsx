import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/AppLayout";
import { BudgetSimulator } from "@/components/BudgetSimulator";
import { ForecastChart } from "@/components/ForecastChart";
import { BudgetAllocationPie } from "@/components/BudgetAllocationPie";
import { MetricCard } from "@/components/MetricCard";
import { InsightsPanel } from "@/components/InsightsPanel";
import { useForecast } from "@/lib/forecast-context";
import { formatINR, formatMultiple } from "@/lib/format";

export const Route = createFileRoute("/budget-simulator")({
  head: () => ({
    meta: [
      { title: "Budget Simulator · ForecastIQ" },
      { name: "description", content: "Simulate media budget allocations and observe probabilistic revenue impact in real time." },
    ],
  }),
  component: BudgetSimulatorPage,
});

function BudgetSimulatorPage() {
  const { forecast } = useForecast();
  return (
    <PageContainer
      title="Budget Simulator"
      description="Move sliders. Forecasts, ROAS, distribution, and AI insights recompute in real time."
    >
      <div className="grid gap-3 xl:grid-cols-[340px_minmax(0,1fr)]">
        <BudgetSimulator />
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <MetricCard
              label="Total spend"
              value={forecast ? formatINR(forecast.totalBudget) : "—"}
              sub="current allocation"
              tone="primary"
              hint="input"
            />
            <MetricCard
              label="Projected revenue"
              value={forecast ? formatINR(forecast.revenue.p50) : "—"}
              sub={forecast ? `${formatINR(forecast.revenue.p10)} – ${formatINR(forecast.revenue.p90)}` : ""}
              hint="P50"
            />
            <MetricCard
              label="Projected ROAS"
              value={forecast ? formatMultiple(forecast.roas.p50) : "—"}
              sub={forecast ? `${formatMultiple(forecast.roas.p10)} – ${formatMultiple(forecast.roas.p90)}` : ""}
              hint="blended"
            />
            <MetricCard
              label="Marginal ROAS"
              value={forecast ? formatMultiple(forecast.roas.p50 * 0.86) : "—"}
              sub="next ₹1L of spend"
              hint="marginal"
              tone="warning"
            />
          </div>
          <ForecastChart />
          <div className="grid gap-3 lg:grid-cols-2">
            <BudgetAllocationPie />
            <InsightsPanel />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
