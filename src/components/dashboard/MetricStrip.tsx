import { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Stat {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  delta?: number;
  tone?: "default" | "primary" | "warning" | "error";
  emphasis?: boolean;
}

function toneCls(tone: Stat["tone"]) {
  switch (tone) {
    case "primary":
      return "text-primary";
    case "warning":
      return "text-warning";
    case "error":
      return "text-error";
    default:
      return "text-foreground";
  }
}

/**
 * Borderless inline metric strip. Uses hairline dividers between cells
 * instead of card containers.
 */
export function MetricStrip({ stats }: { stats: Stat[] }) {
  return (
    <div className="hairline-t hairline-b grid grid-cols-2 divide-x divide-[color:var(--border)] md:grid-cols-3 lg:grid-cols-6">
      {stats.map((s, i) => {
        const positive = (s.delta ?? 0) >= 0;
        return (
          <div
            key={i}
            className="min-w-0 px-4 py-3 md:px-5 md:py-4"
          >
            <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {s.label}
            </div>
            <div
              className={cn(
                "mono mt-2 truncate font-semibold leading-none",
                s.emphasis ? "text-[26px] md:text-[30px]" : "text-[19px] md:text-[21px]",
                toneCls(s.tone),
              )}
            >
              {s.value}
            </div>
            <div className="mono mt-1.5 flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
              {typeof s.delta === "number" ? (
                <span
                  className={cn(
                    "flex items-center gap-0.5",
                    positive ? "text-primary" : "text-error",
                  )}
                >
                  {positive ? (
                    <ArrowUpRight className="h-2.5 w-2.5" />
                  ) : (
                    <ArrowDownRight className="h-2.5 w-2.5" />
                  )}
                  {(s.delta * 100).toFixed(1)}%
                </span>
              ) : null}
              {s.sub ? <span className="truncate">{s.sub}</span> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
