import { useForecast } from "@/lib/forecast-context";
import { formatINR, formatMultiple, formatPct } from "@/lib/format";

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="hairline-b py-2">
      <div className="mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div className="mono mt-0.5 text-[14px] text-foreground">{value}</div>
      {hint ? <div className="mono text-[10px] text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

export function ForecastContextPanel() {
  const { forecast, state, runAt } = useForecast();
  const total = state.budget.google + state.budget.meta + state.budget.microsoft;
  const ts = runAt ? new Date(runAt).toLocaleTimeString("en-IN", { hour12: false }) : "—";

  return (
    <div className="flex h-full flex-col bg-panel">
      <div className="hairline-b flex h-14 items-center gap-2 px-4">
        <div className="mono text-[10px] uppercase tracking-[0.18em] text-primary">
          Forecast Context
        </div>
        <span className="mono ml-auto text-[10px] text-muted-foreground">{ts}</span>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <Row
          label="Forecast Revenue"
          value={forecast ? formatINR(forecast.revenue.p50) : "—"}
          hint={forecast ? `${formatINR(forecast.revenue.p10)} – ${formatINR(forecast.revenue.p90)}` : ""}
        />
        <Row
          label="ROAS"
          value={forecast ? formatMultiple(forecast.roas.p50) : "—"}
          hint={forecast ? `${formatMultiple(forecast.roas.p10)} – ${formatMultiple(forecast.roas.p90)}` : ""}
        />
        <Row
          label="Confidence"
          value={forecast ? formatPct(forecast.confidence, 0) : "—"}
          hint="Posterior interval"
        />
        <Row label="Forecast Horizon" value={`${state.horizon} Days`} />
        <Row label="Current Budget" value={formatINR(total)} hint="Blended" />
        <Row label="Google Budget" value={formatINR(state.budget.google)} />
        <Row label="Meta Budget" value={formatINR(state.budget.meta)} />
        <Row label="Microsoft Budget" value={formatINR(state.budget.microsoft)} />
        <Row label="Current Drilldown" value={state.level.replace(/-/g, " ")} />
        <Row label="Selected Channel" value={state.channelFilter} />
        <Row
          label="Prediction Timestamp"
          value={ts}
          hint={forecast ? `Model v4.2.1 · ${forecast.campaigns.length} campaigns` : ""}
        />
      </div>
    </div>
  );
}
