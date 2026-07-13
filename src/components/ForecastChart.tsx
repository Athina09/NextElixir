import { useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";
import { useForecast } from "@/lib/forecast-context";
import { formatINR, formatMultiple } from "@/lib/format";

const GRID = "rgba(255,255,255,0.05)";
const AXIS = "#6B6F7A";

function ChartTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null;
  const p: any = payload[0].payload;
  return (
    <div className="panel min-w-[180px] p-2.5 text-[11px] shadow-lg">
      <div className="mono mb-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
        Day {p.day} · {p.date}
      </div>
      <div className="mono flex items-center justify-between gap-6">
        <span className="text-muted-foreground">P50</span>
        <span className="font-semibold">{formatINR(p.p50)}</span>
      </div>
      <div className="mono flex items-center justify-between gap-6 text-muted-foreground">
        <span>P10 – P90</span>
        <span>
          {formatINR(p.p10)} – {formatINR(p.p90)}
        </span>
      </div>
      <div className="mono flex items-center justify-between gap-6 text-muted-foreground">
        <span>ROAS</span>
        <span>{formatMultiple(p.roas)}</span>
      </div>
    </div>
  );
}

export function ForecastChart() {
  const { forecast, loading } = useForecast();
  const [showBand, setShowBand] = useState(true);

  const bandData = useMemo(
    () =>
      forecast?.timeline.map((p) => ({
        ...p,
        band: [p.p10, p.p90],
      })) ?? [],
    [forecast],
  );

  return (
    <div className="panel flex flex-col">
      <div className="hairline-b flex items-center justify-between px-4 py-3">
        <div>
          <div className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Probabilistic Revenue Forecast
          </div>
          <div className="mt-0.5 text-[13px] font-medium">
            {forecast?.horizon ?? 0}-day projection · P10 / P50 / P90 bands
          </div>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <button
            onClick={() => setShowBand((v) => !v)}
            className="hairline-b rounded-sm bg-panel-2/70 px-2 py-1 text-muted-foreground hover:text-foreground"
          >
            {showBand ? "Hide" : "Show"} band
          </button>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span
              className="inline-block h-2 w-3"
              style={{ background: "color-mix(in oklab, var(--primary) 30%, transparent)" }}
            />
            Confidence band
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="inline-block h-0.5 w-4 bg-primary" />
            P50 median
          </div>
        </div>
      </div>
      <div className="h-[380px] w-full px-2 pb-2 pt-4">
        {loading && !forecast ? (
          <div className="h-full w-full animate-pulse rounded-sm bg-panel-2/40" />
        ) : (
          <motion.div
            key={forecast?.generatedAt}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
            className="h-full w-full"
          >
            <ResponsiveContainer>
              <ComposedChart data={bandData} margin={{ top: 10, right: 24, left: 8, bottom: 8 }}>
                <defs>
                  <linearGradient id="bandFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3FA796" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#3FA796" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke={AXIS}
                  tick={{ fontFamily: "JetBrains Mono", fontSize: 10, fill: AXIS }}
                  tickLine={false}
                  axisLine={{ stroke: GRID }}
                  interval={Math.floor((bandData.length || 30) / 8)}
                />
                <YAxis
                  stroke={AXIS}
                  tick={{ fontFamily: "JetBrains Mono", fontSize: 10, fill: AXIS }}
                  tickLine={false}
                  axisLine={{ stroke: GRID }}
                  tickFormatter={(v) => formatINR(v as number, { decimals: 0 })}
                  width={60}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: AXIS, strokeDasharray: 2 }} />
                {showBand ? (
                  <Area
                    type="monotone"
                    dataKey="band"
                    stroke="none"
                    fill="url(#bandFill)"
                    isAnimationActive
                    animationDuration={500}
                  />
                ) : null}
                <Line
                  type="monotone"
                  dataKey="p50"
                  stroke="#3FA796"
                  strokeWidth={1.8}
                  dot={false}
                  isAnimationActive
                  animationDuration={600}
                />
                <Line
                  type="monotone"
                  dataKey="p10"
                  stroke="#3FA796"
                  strokeOpacity={0.35}
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="p90"
                  stroke="#3FA796"
                  strokeOpacity={0.35}
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>
    </div>
  );
}
