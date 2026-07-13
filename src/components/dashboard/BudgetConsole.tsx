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
    <section>
      {/* Header */}
      <div className="hairline-b flex items-end justify-between pb-3">
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

      {/* Rows */}
      <div className="mt-5 space-y-7">
        {ROWS.map((row) => {
          const value = state.budget[row.key];
          const pct = total > 0 ? (value / total) * 100 : 0;
          const projected = revenueP50 * (total > 0 ? value / total : 0);
          return (
            <div key={row.key}>
              <div className="flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[13px] font-medium">{row.label}</div>
                  <div className="text-[10.5px] text-muted-foreground">
                    {row.hint}
                  </div>
                </div>
                <div className="flex items-baseline gap-6 text-right">
                  <div>
                    <div className="mono text-[9.5px] uppercase tracking-widest text-muted-foreground">
                      Allocation
                    </div>
                    <div className="mono text-[13px] text-foreground">
                      {pct.toFixed(0)}%
                    </div>
                  </div>
                  <div>
                    <div className="mono text-[9.5px] uppercase tracking-widest text-muted-foreground">
                      Spend
                    </div>
                    <div className="mono text-[17px] font-semibold text-foreground">
                      {formatINR(value)}
                    </div>
                  </div>
                  <div>
                    <div className="mono text-[9.5px] uppercase tracking-widest text-muted-foreground">
                      Exp. revenue
                    </div>
                    <div className="mono text-[13px] text-primary">
                      {formatINR(projected)}
                    </div>
                  </div>
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
                <div className="mono mt-1.5 flex justify-between text-[9.5px] text-muted-foreground">
                  <span>{formatINR(0)}</span>
                  <span>{formatINR(MAX, { decimals: 0 })}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
