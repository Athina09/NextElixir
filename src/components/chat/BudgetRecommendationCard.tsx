import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Row {
  channel: string;
  current: number;
  proposed: number;
  delta: number;
  rationale: string;
}

export function BudgetRecommendationCard({ rows }: { rows: Row[] }) {
  return (
    <div className="mt-2 rounded-sm border border-primary/30 bg-primary/5 p-3">
      <div className="mono mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-primary">
        <Wallet className="h-3 w-3" /> Recommended reallocation
      </div>
      <div className="space-y-2">
        {rows.map((r) => {
          const up = r.delta >= 0;
          return (
            <div key={r.channel} className="rounded-sm bg-panel-2/60 p-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[12.5px] font-medium text-foreground">{r.channel}</div>
                <div
                  className={cn(
                    "mono flex items-center gap-1 text-[11px]",
                    up ? "text-primary" : "text-error",
                  )}
                >
                  {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {(r.delta * 100).toFixed(1)}%
                </div>
              </div>
              <div className="mono mt-1 flex items-baseline justify-between text-[11.5px] text-muted-foreground">
                <span>{formatINR(r.current)} → <span className="text-foreground">{formatINR(r.proposed)}</span></span>
              </div>
              <p className="mt-1 text-[11.5px] text-muted-foreground">{r.rationale}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
