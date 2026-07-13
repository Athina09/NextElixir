import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  TrendingUp,
  Target,
  Sliders,
  GitCompareArrows,
  History,
  Upload,
  FileText,
  Settings as SettingsIcon,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/forecasts", label: "Forecasts", icon: TrendingUp },
  { to: "/campaign-analytics", label: "Campaign Analytics", icon: Target },
  { to: "/budget-simulator", label: "Budget Simulator", icon: Sliders },
  { to: "/scenario-comparison", label: "Scenario Comparison", icon: GitCompareArrows },
  { to: "/forecast-history", label: "Forecast History", icon: History },
  { to: "/upload", label: "Upload Data", icon: Upload },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="hairline-r hidden w-[232px] shrink-0 flex-col bg-panel md:flex">
      <div className="hairline-b flex h-14 items-center gap-2 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" strokeWidth={2.25} />
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-semibold tracking-tight">ForecastIQ</div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            NetElixir
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        <div className="mb-1 px-2 pt-2 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Workspace
        </div>
        <ul className="space-y-0.5">
          {NAV.map((item) => {
            const active =
              item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-[13px] transition-colors",
                    active
                      ? "bg-panel-2 text-foreground"
                      : "text-muted-foreground hover:bg-panel-2 hover:text-foreground",
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                    )}
                    strokeWidth={2}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="hairline-t p-3">
        <div className="rounded-sm bg-panel-2 p-2.5 text-[11px] text-muted-foreground">
          <div className="mono text-[10px] uppercase tracking-widest text-primary">
            Model v4.2.1
          </div>
          <div className="mt-0.5 leading-snug">
            Bayesian hierarchical • MMM+Attribution ensemble
          </div>
        </div>
      </div>
    </aside>
  );
}
