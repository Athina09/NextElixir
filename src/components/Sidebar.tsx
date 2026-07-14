import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  Calculator,
  GitCompareArrows,
  History,
  Upload,
  BookOpen,
  Settings as SettingsIcon,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/forecasts", label: "Forecasts", icon: TrendingUp },
  { to: "/ai-assistant", label: "AI Assistant", icon: Bot },
  { to: "/campaign-analytics", label: "Campaign Analytics", icon: BarChart3 },
  { to: "/budget-simulator", label: "Budget Simulator", icon: Calculator },
  { to: "/scenario-comparison", label: "Scenario Comparison", icon: GitCompareArrows },
  { to: "/forecast-history", label: "Forecast History", icon: History },
  { to: "/upload", label: "Upload Data", icon: Upload },
  { to: "/reports", label: "Reports", icon: BookOpen },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

function NavList({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <ul className="space-y-0.5">
      {NAV.map((item) => {
        const active =
          item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
        return (
          <li key={item.to}>
            <Link
              to={item.to}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-md py-1.5 text-[13px] transition-colors",
                collapsed ? "justify-center px-0" : active ? "pl-3.5 pr-2.5" : "px-2.5",
                active
                  ? "bg-panel-2 text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-panel-2/60 hover:text-foreground",
              )}
            >
              {active && !collapsed && (
                <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full gradient-primary" />
              )}
              <item.icon
                className={cn(
                  "h-3.5 w-3.5 shrink-0",
                  active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                )}
                strokeWidth={2}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function Sidebar({
  collapsed,
  mobileOpen,
  onToggle,
  onCloseMobile,
}: {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggle: () => void;
  onCloseMobile: () => void;
}) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hairline-r hidden shrink-0 flex-col bg-panel transition-[width] duration-200 md:flex",
          collapsed ? "w-[56px]" : "w-[232px]",
        )}
      >
        <div
          className={cn(
            "hairline-b flex h-14 items-center gap-2 px-3",
            collapsed && "justify-center px-2",
          )}
        >
          <div className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-md gradient-primary text-primary-foreground glow-primary">
            <Sparkles className="h-4 w-4" strokeWidth={2.25} />
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1 leading-tight">
                <div className="text-[13px] font-semibold tracking-tight">ForecastIQ</div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  Powered by NetElixir
                </div>
              </div>
              <button
                type="button"
                onClick={onToggle}
                aria-label="Collapse sidebar"
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-panel-2 hover:text-foreground"
              >
                <PanelLeftClose className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </>
          )}
        </div>
        {collapsed && (
          <div className="hairline-b flex h-9 items-center justify-center">
            <button
              type="button"
              onClick={onToggle}
              aria-label="Expand sidebar"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-panel-2 hover:text-foreground"
            >
              <PanelLeftOpen className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </div>
        )}
        <nav className="flex-1 overflow-y-auto p-2">
          {!collapsed && (
            <div className="mb-1 px-2 pt-2 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Workspace
            </div>
          )}
          <NavList collapsed={collapsed} />
        </nav>
        {!collapsed && (
          <div className="hairline-t p-3">
            <div className="rounded-lg border border-border bg-panel-2 p-2.5 text-[11px] text-muted-foreground">
              <div className="mono text-[10px] uppercase tracking-widest text-gradient-primary">
                Model v4.2.1
              </div>
              <div className="mt-0.5 leading-snug">
                Bayesian hierarchical • MMM+Attribution ensemble
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!mobileOpen}
      >
        <div
          onClick={onCloseMobile}
          className={cn(
            "absolute inset-0 bg-black/60 transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
        />
        <aside
          className={cn(
            "hairline-r absolute inset-y-0 left-0 flex w-[260px] flex-col bg-panel shadow-lg transition-transform duration-200",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="hairline-b flex h-14 items-center gap-2 px-3">
            <div className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-md gradient-primary text-primary-foreground glow-primary">
              <Sparkles className="h-4 w-4" strokeWidth={2.25} />
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="text-[13px] font-semibold tracking-tight">ForecastIQ</div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                NetElixir
              </div>
            </div>
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close sidebar"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-panel-2 hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto p-2">
            <div className="mb-1 px-2 pt-2 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Workspace
            </div>
            <NavList collapsed={false} onNavigate={onCloseMobile} />
          </nav>
        </aside>
      </div>
    </>
  );
}
