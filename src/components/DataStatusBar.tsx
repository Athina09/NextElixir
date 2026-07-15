import { CheckCircle2, AlertTriangle, CalendarRange, Layers } from "lucide-react";
import { useForecast } from "@/lib/forecast-context";

const WARNINGS = [
  "Duplicate campaign IDs (4)",
  "Missing UTM parameters (11 rows)",
  "Invalid date format (2 rows)",
];

export function DataStatusBar() {
  const { forecast, loading } = useForecast();
  return (
    <div className="hairline-b flex flex-wrap items-center gap-x-5 gap-y-1.5 bg-panel/60 px-4 py-2 text-[11px]">
      <div className="flex items-center gap-1.5 text-success">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span>Data loaded</span>
      </div>
      <div className="hidden items-center gap-1.5 text-muted-foreground sm:flex">
        <Layers className="h-3.5 w-3.5" />
        <span className="mono">{forecast?.campaigns.length ?? 0} × campaigns · 1,238 total</span>
      </div>
      <div className="hidden items-center gap-1.5 text-muted-foreground sm:flex">
        <CalendarRange className="h-3.5 w-3.5" />
        <span className="mono">Jan 2024 – Jun 2026</span>
      </div>
      <div className="group relative flex items-center gap-1.5 text-warning">
        <AlertTriangle className="h-3.5 w-3.5" />
        <span>Validation · 3 warnings</span>
        <div className="pointer-events-none absolute left-0 top-full z-40 mt-1 w-64 rounded-lg border border-border bg-panel p-2.5 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            Validation warnings
          </div>
          <ul className="space-y-0.5 text-[11px] text-foreground">
            {WARNINGS.map((w) => (
              <li key={w} className="flex items-start gap-1.5">
                <span className="mt-1 h-1 w-1 rounded-full bg-warning" />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="ml-auto hidden items-center gap-1.5 text-muted-foreground sm:flex">
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${loading ? "bg-warning animate-pulse" : "bg-success"}`}
        />
        <span className="mono uppercase tracking-wider">
          {loading ? "computing forecast" : "forecast synced"}
        </span>
      </div>
    </div>
  );
}
