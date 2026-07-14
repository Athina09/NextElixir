import { Bell, Search, ChevronDown, Database, Menu } from "lucide-react";
import { useForecast } from "@/lib/forecast-context";
import { ShopifyLogo } from "@/components/PlatformLogos";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

export function Topbar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const { forecast, runAt } = useForecast();
  const runTime = runAt ? new Date(runAt).toLocaleTimeString("en-IN", { hour12: false }) : "—";
  return (
    <header className="hairline-b sticky top-0 z-30 flex h-14 items-center gap-3 bg-background/80 px-4 backdrop-blur-md">
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-panel-2/60 text-muted-foreground hover:bg-panel-2 hover:text-foreground"
      >
        <Menu className="h-4 w-4" strokeWidth={2} />
      </button>
      <div className="flex flex-1 items-center gap-2">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search campaigns, channels, forecasts…"
            className="w-full rounded-md border border-border bg-panel-2/60 py-1.5 pl-8 pr-3 text-[13px] text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
        </div>
      </div>
      <div className="hidden items-center gap-2 md:flex">

        <div className="rounded-md border border-border bg-panel-2/60 px-2.5 py-1.5 text-[11px] leading-tight">
          <div className="text-muted-foreground">Last forecast</div>
          <div className="mono">{runTime}</div>
        </div>
        {/* Theme switcher */}
        <ThemeSwitcher />
        <button className="relative rounded-md border border-border bg-panel-2/60 p-2 hover:bg-panel-2">
          <Bell className="h-3.5 w-3.5" />
          <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-warning shadow-[0_0_0_2px_var(--panel)]" />
        </button>
        <div className="flex items-center gap-2 rounded-md border border-border bg-panel-2/60 px-2 py-1">
          <div className="flex h-6 w-6 items-center justify-center rounded-full gradient-primary text-[10px] font-semibold text-primary-foreground">
            AN
          </div>
          <div className="text-[11px] leading-tight">
            <div>Analyst</div>
            <div className="text-muted-foreground">NetElixir</div>
          </div>
        </div>
      </div>

    </header>
  );
}
