import { Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useForecast } from "@/lib/forecast-context";
import type { Horizon } from "@/lib/forecast";
import { formatINR } from "@/lib/format";


const MAX = 5_000_000;

interface Row {
  key: "google" | "meta" | "microsoft";
  label: string;
  hint: string;
}

const ROWS: Row[] = [
  { key: "google", label: "Google Ads", hint: "Search · Shopping · PMax" },
  { key: "meta", label: "Meta Ads", hint: "Facebook · Instagram · Reels" },
  { key: "microsoft", label: "Microsoft Ads", hint: "Bing · LinkedIn audience" },
];

const HORIZONS: Horizon[] = [30, 60, 90];

/**
 * Borderless "console" style budget simulator: horizontal channel rows,
 * mixer-inspired, inline currency + allocation + projected impact.
 */
export function BudgetConsole() {
  const { state, dispatch, forecast, loading } = useForecast();
  const total =
    state.budget.google + state.budget.meta + state.budget.microsoft;
  const revenueP50 = forecast?.revenue.p50 ?? 0;

  return (
    <section className="flex h-full min-h-[560px] flex-col border border-[color:var(--border)] bg-panel p-6 lg:h-[620px]">
      {/* Header */}
      <div className="hairline-b flex items-end justify-between gap-3 pb-3">

        <div>
          <div className="mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Budget Console
          </div>
          <div className="mt-1 text-[15px] font-semibold tracking-tight">
            Media allocation · scenario planner
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="mono inline-flex text-[10.5px]">
            {HORIZONS.map((h) => (
              <button
                key={h}
                onClick={() => dispatch({ type: "SET_HORIZON", payload: h })}
                className={`border-b-2 px-3 py-1 transition ${
                  state.horizon === h
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {h}D
              </button>
            ))}
          </div>
          <div className="text-right">
            <div className="mono text-[9.5px] uppercase tracking-widest text-muted-foreground">
              Total budget
            </div>
            <div className="mono text-[17px] font-semibold text-primary">
              {formatINR(total)}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="mono mt-2 text-[10px] text-warning animate-pulse">
          › recomputing forecast…
        </div>
      ) : null}

      {/* Rows — evenly distributed, fill remaining height */}
      <div className="mt-5 flex min-h-0 flex-1 flex-col justify-between gap-6">
        {ROWS.map((row) => {
          const value = state.budget[row.key];
          const pct = total > 0 ? (value / total) * 100 : 0;
          const projected = revenueP50 * (total > 0 ? value / total : 0);
          return (
            <div key={row.key} className="min-w-0">
              <div className="flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium">{row.label}</div>
                  <div className="mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {pct.toFixed(0)}% allocation
                  </div>
                </div>
                <div className="mono shrink-0 text-right text-[17px] font-semibold text-foreground">
                  {formatINR(value)}
                </div>
              </div>
              <div className="mt-3">
                <input
                  type="range"
                  min={0}
                  max={MAX}
                  step={10_000}
                  value={value}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_BUDGET",
                      payload: {
                        [row.key]: Number(e.target.value),
                      } as any,
                    })
                  }
                  className="range-forecast h-[3px] w-full cursor-pointer appearance-none rounded-full bg-[color:var(--panel-2)] accent-primary"
                />
                <div className="mono mt-1.5 flex items-baseline justify-between gap-3 text-[9.5px] text-muted-foreground">
                  <span>{row.hint}</span>
                  <span className="text-primary">
                    exp. {formatINR(projected)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ask AI — pinned bottom */}
      <Link
        to="/ai-assistant"
        className="mono mt-6 flex items-center justify-center gap-2 border border-primary/40 bg-primary/10 py-2.5 text-[11px] font-medium uppercase tracking-widest text-primary hover:bg-primary/20"
      >
        <Sparkles className="h-3 w-3" /> Ask AI to optimize
      </Link>
    </section>
  );
}

