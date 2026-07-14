import { useForecast } from "@/lib/forecast-context";
import { formatINR, formatMultiple, formatPct } from "@/lib/format";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { ChannelLogo } from "@/components/PlatformLogos";

export function ChannelPerformanceTable() {
  const { forecast } = useForecast();
  const rows = forecast?.channels ?? [];
  return (
    <div className="panel overflow-hidden">
      <div className="hairline-b flex items-center justify-between px-4 py-3">
        <div>
          <div className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Channel performance
          </div>
          <div className="mt-0.5 text-[13px] font-medium">Forecast contribution & efficiency</div>
        </div>
      </div>
      <table className="w-full text-[12px]">
        <thead>
          <tr className="hairline-b text-left text-[10px] uppercase tracking-widest text-muted-foreground">
            <th className="px-4 py-2 font-medium">Channel</th>
            <th className="px-2 py-2 text-right font-medium">Budget</th>
            <th className="px-2 py-2 text-right font-medium">Revenue</th>
            <th className="px-2 py-2 text-right font-medium">ROAS</th>
            <th className="px-2 py-2 text-right font-medium">Contribution</th>
            <th className="px-2 py-2 text-right font-medium">Confidence</th>
            <th className="px-4 py-2 text-right font-medium">Trend</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="hairline-b transition hover:bg-panel-2/40">
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <ChannelLogo channel={r.name} size={16} className="shrink-0" />
                  {r.name}
                </div>
              </td>
              <td className="mono px-2 py-2.5 text-right">{formatINR(r.spend)}</td>
              <td className="mono px-2 py-2.5 text-right">{formatINR(r.revenue)}</td>
              <td className="mono px-2 py-2.5 text-right text-primary">
                {formatMultiple(r.roas)}
              </td>
              <td className="mono px-2 py-2.5 text-right">
                <div className="flex items-center justify-end gap-2">
                  <div className="h-1 w-20 rounded-full bg-panel-2">
                    <div
                      className="h-full rounded-full bg-primary/70"
                      style={{ width: `${(r.contribution * 100).toFixed(0)}%` }}
                    />
                  </div>
                  {formatPct(r.contribution, 0)}
                </div>
              </td>
              <td className="mono px-2 py-2.5 text-right text-muted-foreground">
                {formatPct(r.confidence, 0)}
              </td>
              <td className="px-4 py-2.5 text-right">
                <div className="ml-auto h-6 w-24">
                  <ResponsiveContainer>
                    <LineChart data={r.trend.map((v, i) => ({ i, v }))}>
                      <Line
                        type="monotone"
                        dataKey="v"
                        stroke="#3B82F6"
                        strokeWidth={1.2}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
