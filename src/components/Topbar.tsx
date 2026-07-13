import { Bell, Search, ChevronDown, Database } from "lucide-react";
import { useForecast } from "@/lib/forecast-context";

export function Topbar() {
  const { forecast, runAt } = useForecast();
  const runTime = runAt ? new Date(runAt).toLocaleTimeString("en-IN", { hour12: false }) : "—";
  return (
    <header className="hairline-b sticky top-0 z-30 flex h-14 items-center gap-3 bg-background/90 px-4 backdrop-blur">
      <div className="flex flex-1 items-center gap-2">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search campaigns, channels, forecasts…"
            className="hairline-b w-full rounded-sm bg-panel-2/60 py-1.5 pl-8 pr-3 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/60"
          />
        </div>
      </div>
      <div className="hidden items-center gap-2 md:flex">
        <div className="hairline-b flex items-center gap-2 rounded-sm bg-panel-2/60 px-2.5 py-1.5">
          <Database className="h-3.5 w-3.5 text-primary" />
          <div className="text-[11px] leading-tight">
            <div className="text-muted-foreground">Dataset</div>
            <div className="mono text-[11px]">acme_retail_2024_06</div>
          </div>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </div>
        <div className="hairline-b rounded-sm bg-panel-2/60 px-2.5 py-1.5 text-[11px] leading-tight">
          <div className="text-muted-foreground">Last forecast</div>
          <div className="mono">{runTime}</div>
        </div>
        <button className="hairline-b relative rounded-sm bg-panel-2/60 p-2 hover:bg-panel-2">
          <Bell className="h-3.5 w-3.5" />
          <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-warning" />
        </button>
        <div className="flex items-center gap-2 rounded-sm bg-panel-2/60 px-2 py-1">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-[10px] font-semibold text-primary">
            AN
          </div>
          <div className="text-[11px] leading-tight">
            <div>Analyst</div>
            <div className="text-muted-foreground">NetElixir</div>
          </div>
        </div>
      </div>
      <div className="mono ml-2 hidden text-[10px] text-muted-foreground lg:block">
        {forecast ? `${forecast.horizon}D · ${forecast.campaigns.length} campaigns` : "loading…"}
      </div>
    </header>
  );
}
