import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useForecast } from "@/lib/forecast-context";
import { formatINR, formatPct } from "@/lib/format";

const COLORS = ["#3FA796", "#6EA8FE", "#D4A24C"];

export function BudgetAllocationPie() {
  const { forecast, state } = useForecast();
  const data = [
    { name: "Google Ads", value: state.budget.google },
    { name: "Meta Ads", value: state.budget.meta },
    { name: "Microsoft Ads", value: state.budget.microsoft },
  ];
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="panel flex h-full flex-col">
      <div className="hairline-b px-4 py-3">
        <div className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Budget allocation
        </div>
        <div className="mt-0.5 text-[13px] font-medium">Distribution across channels</div>
      </div>
      <div className="flex flex-1 items-center gap-4 p-4">
        <div className="h-[160px] w-[160px] shrink-0">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                innerRadius={50}
                outerRadius={72}
                paddingAngle={2}
                stroke="none"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#181A21", border: "1px solid rgba(255,255,255,0.08)", fontSize: 11 }}
                formatter={(v: number) => formatINR(v)}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="flex-1 space-y-1.5 text-[12px]">
          {data.map((d, i) => (
            <li key={d.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-sm" style={{ background: COLORS[i] }} />
                {d.name}
              </div>
              <div className="mono text-muted-foreground">
                {formatINR(d.value)}{" "}
                <span className="text-foreground">· {formatPct(d.value / total, 0)}</span>
              </div>
            </li>
          ))}
          <li className="hairline-t mono mt-2 flex items-center justify-between pt-2 text-[12px]">
            <span className="text-muted-foreground">Total</span>
            <span className="text-primary">{formatINR(total)}</span>
          </li>
          {forecast ? (
            <li className="mono text-[10px] text-muted-foreground">
              Blended ROAS forecast · {forecast.roas.p50.toFixed(2)}x
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
