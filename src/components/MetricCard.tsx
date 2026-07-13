import { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  delta?: number;
  spark?: number[];
  hint?: string;
  loading?: boolean;
  tone?: "default" | "primary" | "warning" | "error";
}

export function MetricCard({
  label,
  value,
  sub,
  delta,
  spark,
  hint,
  loading,
  tone = "default",
}: Props) {
  const positive = (delta ?? 0) >= 0;
  const toneColor =
    tone === "primary"
      ? "text-primary"
      : tone === "warning"
        ? "text-warning"
        : tone === "error"
          ? "text-error"
          : "text-foreground";
  return (
    <div className="panel flex min-w-0 flex-col gap-2 p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 truncate text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </div>
        {hint ? (
          <div className="mono shrink-0 text-[10px] text-muted-foreground">{hint}</div>
        ) : null}
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "mono truncate text-[22px] font-semibold leading-none",
              toneColor,
            )}
          >
            {loading ? <span className="text-muted-foreground">—</span> : value}
          </div>
          {sub ? (
            <div className="mono mt-1.5 truncate text-[11px] text-muted-foreground">
              {sub}
            </div>
          ) : null}
        </div>
        {spark && spark.length ? (
          <div className="hidden h-9 w-16 shrink-0 2xl:block">
            <ResponsiveContainer>
              <LineChart data={spark.map((v, i) => ({ i, v }))}>
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke="var(--primary)"
                  strokeWidth={1.4}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : null}
      </div>
      {typeof delta === "number" ? (
        <div
          className={cn(
            "mono flex items-center gap-1 text-[11px]",
            positive ? "text-primary" : "text-error",
          )}
        >
          {positive ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : (
            <ArrowDownRight className="h-3 w-3" />
          )}
          {(delta * 100).toFixed(1)}%
          <span className="text-muted-foreground">vs prior period</span>
        </div>
      ) : null}
    </div>
  );
}
