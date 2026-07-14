import { createFileRoute } from "@tanstack/react-router";
import { PageContainer } from "@/components/AppLayout";
import { InsightsPanel } from "@/components/InsightsPanel";
import { useForecast } from "@/lib/forecast-context";
import { formatINR, formatMultiple, formatPct } from "@/lib/format";
import { FileText, FileSpreadsheet, FileDown, Sparkles, Presentation } from "lucide-react";
import { NetElixirLogo } from "@/components/PlatformLogos";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports · ForecastIQ" },
      { name: "description", content: "Generate executive, forecast, campaign, and budget reports." },
    ],
  }),
  component: ReportsPage,
});

const REPORTS = [
  {
    title: "Executive Report",
    desc: "One-page summary for leadership with forecast, ROAS, risk flags, and recommendations.",
  },
  {
    title: "Forecast Report",
    desc: "Full probabilistic forecast with confidence bands, distribution, and drill-down tables.",
  },
  {
    title: "Campaign Report",
    desc: "Campaign-level efficiency, contribution, and confidence intervals.",
  },
  {
    title: "Budget Report",
    desc: "Budget allocation vs. forecasted revenue and marginal ROAS analysis.",
  },
];

function ReportsPage() {
  const { forecast } = useForecast();
  return (
    <PageContainer
      title="Reports"
      description="Generate exportable reports and share the current forecast with your team."
    >
      <div className="grid gap-3 md:grid-cols-2">
        {REPORTS.map((r) => (
          <div key={r.title} className="panel p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[13px] font-semibold">{r.title}</div>
                <div className="mt-1 max-w-md text-[11.5px] text-muted-foreground">{r.desc}</div>
              </div>
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="mono flex items-center gap-1.5 rounded-md gradient-primary px-2.5 py-1.5 text-[11px] font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90">
                <FileDown className="h-3 w-3" /> Export PDF
              </button>
              <button className="mono hairline-b flex items-center gap-1.5 rounded-sm bg-panel-2/60 px-2.5 py-1.5 text-[11px] hover:bg-panel-2">
                <FileSpreadsheet className="h-3 w-3" /> Excel
              </button>
              <button className="mono hairline-b flex items-center gap-1.5 rounded-sm bg-panel-2/60 px-2.5 py-1.5 text-[11px] hover:bg-panel-2">
                <FileText className="h-3 w-3" /> CSV
              </button>
              <button className="mono hairline-b flex items-center gap-1.5 rounded-sm bg-panel-2/60 px-2.5 py-1.5 text-[11px] hover:bg-panel-2">
                <Presentation className="h-3 w-3" /> PPT
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="panel p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm gradient-primary text-primary-foreground">
              <Sparkles className="h-2.5 w-2.5" strokeWidth={2.5} />
            </div>
            <div className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              AI Executive summary
            </div>
            <span className="mono rounded-sm bg-primary/15 px-1.5 py-[1px] text-[9px] uppercase tracking-widest text-primary">
              ForecastIQ AI
            </span>
          </div>
          <div className="mono mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <NetElixirLogo size={12} />
            <span>Powered by NetElixir</span>
          </div>
          <div className="mt-3 space-y-2 text-[12.5px] leading-relaxed">
            <p>
              Across the current {forecast?.horizon}D horizon, ForecastIQ projects{" "}
              <span className="mono text-primary">
                {forecast ? formatINR(forecast.revenue.p50) : "—"}
              </span>{" "}
              in ecommerce revenue at a blended ROAS of{" "}
              <span className="mono text-primary">
                {forecast ? formatMultiple(forecast.roas.p50) : "—"}
              </span>
              . Model confidence is {forecast ? formatPct(forecast.confidence, 0) : "—"} with a 90%
              interval spanning {forecast ? formatINR(forecast.revenue.p10) : "—"} —{" "}
              {forecast ? formatINR(forecast.revenue.p90) : "—"}.
            </p>
            <p className="text-muted-foreground">
              Search-led inventory and mid-funnel Shopping remain the primary drivers. Meta
              attribution efficiency is trending down; a rebalance is recommended to sustain blended
              ROAS above 4.0x. Data quality issues are confined to 17 low-severity records.
            </p>
          </div>
        </div>
        <InsightsPanel />
      </div>
    </PageContainer>
  );
}
