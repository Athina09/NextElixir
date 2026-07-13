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
import { formatINR, formatMultiple, formatPct } from "@/lib/format";

const GRID = "rgba(255,255,255,0.04)";
const AXIS = "#6B6F7A";

function HeroTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null;
  const p: any = payload[0].payload;
  return (
    <div className="mono min-w-[200px] rounded-sm border border-[color:var(--border)] bg-panel/95 p-2.5 text-[11px] shadow-xl backdrop-blur">
      <div className="mb-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
        Day {p.day} · {p.date}
      </div>
      <div className="flex items-center justify-between gap-6">
        <span className="text-muted-foreground">P50</span>
        <span className="font-semibold text-foreground">{formatINR(p.p50)}</span>
      </div>
      <div className="flex items-center justify-between gap-6 text-muted-foreground">
        <span>P10 – P90</span>
        <span>
          {formatINR(p.p10)} – {formatINR(p.p90)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-6 text-muted-foreground">
        <span>ROAS</span>
        <span>{formatMultiple(p.roas)}</span>
      </div>
    </div>
  );
}

/**
 * Signature Forecast Hero — dominates the dashboard.
 * Large forecast value + horizontal P10/P50/P90/Confidence stats + massive chart.
 * No card wrapper, only hairline dividers and generous whitespace.
 */
export function ForecastHero() {
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

  const p50 = forecast?.revenue.p50 ?? 0;
  const p10 = forecast?.revenue.p10 ?? 0;
  const p90 = forecast?.revenue.p90 ?? 0;
  const growth = forecast?.growth ?? 0;
  const confidence = forecast?.confidence ?? 0;

  return (
    <section className="flex h-full min-h-[560px] flex-col border border-[color:var(--border)] bg-panel lg:h-[620px]">
      <div className="flex h-full min-h-0 flex-col p-6">
        {/* Header row */}
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            <div className="mono flex items-center gap-3 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Revenue Forecast · {forecast?.horizon ?? 0}-day horizon
            </div>
            <div
              className={`mono mt-3 font-medium leading-none tracking-tight ${
                loading && !forecast ? "text-muted-foreground" : "text-foreground"
              }`}
              style={{ fontSize: "clamp(32px, 4.2vw, 52px)" }}
            >
              {forecast ? formatINR(p50) : "—"}
            </div>
            <div className="mono mt-2 text-[11.5px] text-muted-foreground">
              P50 median · posterior interval {formatPct(confidence, 0)} confidence
            </div>
          </div>

          {/* Horizontal stat row */}
          <div className="flex items-stretch gap-0 divide-x divide-[color:var(--border)] border-l border-r border-[color:var(--border)]">
            {[
              { k: "P10", v: forecast ? formatINR(p10) : "—", tone: "muted" },
              { k: "P50", v: forecast ? formatINR(p50) : "—", tone: "primary" },
              { k: "P90", v: forecast ? formatINR(p90) : "—", tone: "muted" },
              {
                k: "Growth",
                v: forecast ? formatPct(growth) : "—",
                tone: growth >= 0 ? "primary" : "error",
              },
              {
                k: "Confidence",
                v: forecast ? formatPct(confidence, 0) : "—",
                tone: confidence > 0.85 ? "primary" : "warning",
              },
            ].map((s) => (
              <div key={s.k} className="px-5 py-2">
                <div className="mono text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground">
                  {s.k}
                </div>
                <div
                  className={`mono mt-1.5 text-[15px] font-semibold ${
                    s.tone === "primary"
                      ? "text-primary"
                      : s.tone === "warning"
                        ? "text-warning"
                        : s.tone === "error"
                          ? "text-error"
                          : "text-foreground"
                  }`}
                >
                  {s.v}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend + toggle */}
        <div className="mono mt-6 flex items-center justify-between text-[10.5px]">
          <div className="flex items-center gap-5 text-muted-foreground">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-4"
                style={{ background: "color-mix(in oklab, var(--primary) 28%, transparent)" }}
              />
              P10–P90 confidence band
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-[2px] w-5 bg-primary" />
              P50 median
            </div>
          </div>
          <button
            onClick={() => setShowBand((v) => !v)}
            className="text-muted-foreground hover:text-foreground uppercase tracking-widest text-[10px]"
          >
            {showBand ? "Hide" : "Show"} band
          </button>
        </div>

        {/* The chart — fills remaining panel space */}
        <div className="mt-4 min-h-0 w-full flex-1">

          {loading && !forecast ? (
            <div className="h-full w-full animate-pulse rounded-sm bg-panel/40" />
          ) : (
            <motion.div
              key={forecast?.generatedAt}
              initial={{ opacity: 0.3 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="h-full w-full"
            >
              <ResponsiveContainer>
                <ComposedChart
                  data={bandData}
                  margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="heroBandFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3FA796" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#3FA796" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis
                    dataKey="day"
                    stroke={AXIS}
                    tick={{ fontFamily: "JetBrains Mono", fontSize: 10, fill: AXIS }}
                    tickLine={false}
                    axisLine={false}
                    interval={Math.floor((bandData.length || 30) / 10)}
                    tickMargin={12}
                  />
                  <YAxis
                    stroke={AXIS}
                    tick={{ fontFamily: "JetBrains Mono", fontSize: 10, fill: AXIS }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => formatINR(v as number, { decimals: 0 })}
                    width={64}
                    tickMargin={8}
                  />
                  <Tooltip
                    content={<HeroTooltip />}
                    cursor={{ stroke: "#3FA796", strokeOpacity: 0.4, strokeDasharray: "2 3" }}
                  />
                  {showBand ? (
                    <Area
                      type="monotone"
                      dataKey="band"
                      stroke="none"
                      fill="url(#heroBandFill)"
                      isAnimationActive
                      animationDuration={550}
                    />
                  ) : null}
                  <Line
                    type="monotone"
                    dataKey="p50"
                    stroke="#3FA796"
                    strokeWidth={1.75}
                    dot={false}
                    isAnimationActive
                    animationDuration={650}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
