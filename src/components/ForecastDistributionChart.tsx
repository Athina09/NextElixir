import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, ReferenceLine, Tooltip } from "recharts";
import { useForecast } from "@/lib/forecast-context";
import { formatINR } from "@/lib/format";

export function ForecastDistributionChart() {
  const { forecast } = useForecast();
  if (!forecast) return <div className="panel h-[220px] animate-pulse" />;
  const mean = forecast.revenue.p50;
  const data = forecast.distribution.map((d) => ({ ...d, density: d.density * 1_000_000 }));
  return (
    <div className="panel flex h-full flex-col">
      <div className="hairline-b px-4 py-3">
        <div className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Revenue distribution
        </div>
        <div className="mt-0.5 text-[13px] font-medium">Probability density · 90D outlook</div>
      </div>
      <div className="h-[220px] flex-1 p-2">
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 6 }}>
            <defs>
              <linearGradient id="distFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3FA796" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#3FA796" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="bucket"
              tick={{ fontFamily: "JetBrains Mono", fontSize: 9, fill: "#6B6F7A" }}
              tickFormatter={(v) => formatINR(v as number, { decimals: 0 })}
              stroke="#6B6F7A"
              tickLine={false}
              axisLine={false}
              interval={6}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{ background: "#181A21", border: "1px solid rgba(255,255,255,0.08)", fontSize: 11 }}
              formatter={(v: number) => v.toFixed(3)}
              labelFormatter={(v) => `Rev ${formatINR(v as number)}`}
            />
            <Area
              type="monotone"
              dataKey="density"
              stroke="#3FA796"
              strokeWidth={1.5}
              fill="url(#distFill)"
              isAnimationActive
              animationDuration={600}
            />
            <ReferenceLine
              x={mean}
              stroke="#D4A24C"
              strokeDasharray="2 2"
              label={{ value: "μ P50", fill: "#D4A24C", fontSize: 10, position: "top" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
