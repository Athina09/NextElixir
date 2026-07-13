import { useForecast } from "@/lib/forecast-context";
import type { Horizon } from "@/lib/forecast";
import { formatINR } from "@/lib/format";
import { Minus, Plus } from "lucide-react";

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

export function BudgetSimulator({ compact = false }: { compact?: boolean }) {
  const { state, dispatch, loading } = useForecast();
  const total = state.budget.google + state.budget.meta + state.budget.microsoft;

  return (
    <div className="panel">
      <div className="hairline-b flex items-center justify-between px-4 py-3">
        <div>
          <div className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Budget simulator
          </div>
          <div className="mt-0.5 text-[13px] font-medium">Allocate media spend by channel</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Total</div>
          <div className="mono text-[16px] font-semibold text-primary">{formatINR(total)}</div>
        </div>
      </div>
      <div className={compact ? "p-3" : "p-4"}>
        <div className="mb-4 inline-flex hairline-b rounded-sm bg-panel-2/60 p-0.5 text-[11px]">
          {HORIZONS.map((h) => (
            <button
              key={h}
              onClick={() => dispatch({ type: "SET_HORIZON", payload: h })}
              className={`mono px-3 py-1 transition ${
                state.horizon === h
                  ? "rounded-sm bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {h}D
            </button>
          ))}
          {loading ? (
            <span className="mono ml-2 self-center text-[10px] text-warning animate-pulse">
              recomputing…
            </span>
          ) : null}
        </div>
        <div className="space-y-4">
          {ROWS.map((row) => {
            const value = state.budget[row.key];
            const pct = (value / MAX) * 100;
            return (
              <div key={row.key}>
                <div className="mb-1.5 flex items-center justify-between">
                  <div>
                    <div className="text-[12.5px] font-medium">{row.label}</div>
                    <div className="text-[10.5px] text-muted-foreground">{row.hint}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        dispatch({
                          type: "SET_BUDGET",
                          payload: { [row.key]: Math.max(0, value - 50_000) } as any,
                        })
                      }
                      className="hairline-b rounded-sm bg-panel-2 p-1 hover:bg-panel-2/70"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <input
                      value={value}
                      onChange={(e) =>
                        dispatch({
                          type: "SET_BUDGET",
                          payload: {
                            [row.key]: Math.max(0, Math.min(MAX, Number(e.target.value) || 0)),
                          } as any,
                        })
                      }
                      className="mono hairline-b w-24 rounded-sm bg-panel-2 px-2 py-1 text-right text-[12px] focus:outline-none focus:ring-1 focus:ring-primary/60"
                    />
                    <button
                      onClick={() =>
                        dispatch({
                          type: "SET_BUDGET",
                          payload: { [row.key]: Math.min(MAX, value + 50_000) } as any,
                        })
                      }
                      className="hairline-b rounded-sm bg-panel-2 p-1 hover:bg-panel-2/70"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min={0}
                    max={MAX}
                    step={10_000}
                    value={value}
                    onChange={(e) =>
                      dispatch({
                        type: "SET_BUDGET",
                        payload: { [row.key]: Number(e.target.value) } as any,
                      })
                    }
                    className="range-forecast h-1 w-full cursor-pointer appearance-none rounded-full bg-panel-2 accent-primary"
                  />
                  <div className="mono mt-1 flex justify-between text-[9.5px] text-muted-foreground">
                    <span>{formatINR(0)}</span>
                    <span>{formatINR(value)} · {pct.toFixed(0)}%</span>
                    <span>{formatINR(MAX, { decimals: 0 })}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
