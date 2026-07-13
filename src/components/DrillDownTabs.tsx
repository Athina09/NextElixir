import { useForecast } from "@/lib/forecast-context";
import type { Level } from "@/lib/forecast";

const OPTIONS: { key: Level; label: string; hint: string }[] = [
  { key: "aggregate", label: "Aggregate", hint: "lowest uncertainty" },
  { key: "channel", label: "Channel", hint: "google · meta · msft" },
  { key: "campaignType", label: "Campaign Type", hint: "search · pmax · display" },
  { key: "campaign", label: "Campaign", hint: "higher uncertainty" },
];

export function DrillDownTabs() {
  const { state, dispatch } = useForecast();
  return (
    <div className="hairline-b flex items-center justify-between px-4 py-2">
      <div className="hidden gap-1 md:flex">
        {OPTIONS.map((o) => {
          const active = state.level === o.key;
          return (
            <button
              key={o.key}
              onClick={() => dispatch({ type: "SET_LEVEL", payload: o.key })}
              className={`group flex items-center gap-2 rounded-sm px-2.5 py-1.5 text-[12px] transition ${
                active
                  ? "bg-panel-2 text-foreground"
                  : "text-muted-foreground hover:bg-panel-2/60 hover:text-foreground"
              }`}
            >
              <span>{o.label}</span>
              <span className="mono text-[10px] text-muted-foreground">{o.hint}</span>
            </button>
          );
        })}
      </div>
      <select
        value={state.level}
        onChange={(e) => dispatch({ type: "SET_LEVEL", payload: e.target.value as Level })}
        className="mono hairline-b block rounded-sm bg-panel-2 px-2 py-1 text-[12px] md:hidden"
      >
        {OPTIONS.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
      <div className="mono text-[10.5px] uppercase tracking-widest text-muted-foreground">
        drill-down · level={state.level}
      </div>
    </div>
  );
}
