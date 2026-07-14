/**
 * ForecastContextPanel — simplified.
 * Shows only the 5 most relevant live metrics in a compact card grid.
 * Keeps the timestamp and model info at the bottom.
 */
import { useForecast } from "@/lib/forecast-context";
import { formatINR, formatMultiple, formatPct } from "@/lib/format";
import { TrendingUp, Target, ShieldCheck, Layers, Clock } from "lucide-react";

interface MetricProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
}

function Metric({ label, value, sub, icon }: MetricProps) {
  return (
    <div className="rounded-lg border border-border bg-panel-2/50 p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <span className="text-primary opacity-80">{icon}</span>
        <span className="mono text-[9.5px] uppercase tracking-[0.16em]">{label}</span>
      </div>
      <div className="mono mt-1.5 text-[16px] font-semibold text-foreground">{value}</div>
      {sub && (
        <div className="mono mt-0.5 text-[10px] text-muted-foreground">{sub}</div>
      )}
    </div>
  );
}

export function ForecastContextPanel() {
  const { forecast, state, runAt } = useForecast();
  const total = state.budget.google + state.budget.meta + state.budget.microsoft;
  const ts = runAt ? new Date(runAt).toLocaleTimeString("en-IN", { hour12: false }) : "—";

  return (
    <div className="flex h-full flex-col bg-panel">
      {/* Header */}
      <div className="hairline-b flex h-12 items-center justify-between px-4">
        <span className="mono text-[10px] uppercase tracking-[0.18em] text-primary">
          Live Context
        </span>
        <div className="mono flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock className="h-2.5 w-2.5" />
          {ts}
        </div>
      </div>

      {/* Metric cards */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 gap-2">
          <Metric
            label="Revenue P50"
            value={forecast ? formatINR(forecast.revenue.p50) : "—"}
            sub={forecast ? `${formatINR(forecast.revenue.p10)} – ${formatINR(forecast.revenue.p90)}` : undefined}
            icon={<TrendingUp className="h-3 w-3" />}
          />
          <Metric
            label="ROAS"
            value={forecast ? formatMultiple(forecast.roas.p50) : "—"}
            sub={forecast ? `${formatMultiple(forecast.roas.p10)} – ${formatMultiple(forecast.roas.p90)}` : undefined}
            icon={<Target className="h-3 w-3" />}
          />
          <Metric
            label="Confidence"
            value={forecast ? formatPct(forecast.confidence, 0) : "—"}
            sub="Posterior interval"
            icon={<ShieldCheck className="h-3 w-3" />}
          />
          <Metric
            label="Budget · Blended"
            value={formatINR(total)}
            sub={`${state.horizon}D horizon`}
            icon={<Layers className="h-3 w-3" />}
          />
        </div>

        {/* Budget split */}
        <div className="mt-4 space-y-1.5">
          <div className="mono text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">
            Budget split
          </div>
          {[
            { label: "Google", value: state.budget.google, total },
            { label: "Meta", value: state.budget.meta, total },
            { label: "Microsoft", value: state.budget.microsoft, total },
          ].map((r) => (
            <div key={r.label} className="flex items-center gap-2">
              <span className="w-16 text-[11px] text-muted-foreground">{r.label}</span>
              <div className="flex-1 rounded-full bg-panel-2 h-1.5">
                <div
                  className="h-full rounded-full gradient-primary opacity-80"
                  style={{ width: `${r.total > 0 ? (r.value / r.total) * 100 : 0}%` }}
                />
              </div>
              <span className="mono w-14 text-right text-[10px] text-muted-foreground">
                {formatINR(r.value)}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-4 rounded-lg border border-border bg-panel-2/40 px-3 py-2 text-[10.5px] text-muted-foreground">
          <div className="mono text-[9px] uppercase tracking-widest text-primary">
            Model v4.2.1
          </div>
          <div className="mt-0.5">
            {forecast ? `${forecast.campaigns.length} campaigns · Bayesian hierarchical` : "Loading…"}
          </div>
        </div>
      </div>
    </div>
  );
}
