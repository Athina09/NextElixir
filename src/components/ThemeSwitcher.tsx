/**
 * ThemeSwitcher.tsx
 *
 * A single button that opens a small dropdown panel
 * showing all theme options. Click outside to close.
 */
import { useEffect, useRef, useState } from "react";
import { Palette, Check } from "lucide-react";
import { useTheme, THEMES, type ThemeId } from "@/lib/theme-context";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Switch theme"
        aria-expanded={open}
        className="mono flex items-center gap-1.5 rounded-md border border-border bg-panel-2/60 px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      >
        {/* Live swatch dot */}
        <span
          className="h-2.5 w-2.5 rounded-full border border-white/20"
          style={{ backgroundColor: theme.swatch }}
        />
        <Palette className="h-3 w-3" />
        Theme
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-44 overflow-hidden rounded-lg border border-border bg-panel shadow-lg">
          <div className="mono px-3 py-2 text-[9px] uppercase tracking-[0.18em] text-muted-foreground border-b border-border bg-panel-2/40">
            Color Theme
          </div>
          <div className="py-1">
            {THEMES.map((t) => {
              const active = t.id === theme.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id as ThemeId);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-[12px] transition-colors ${
                    active
                      ? "bg-primary/15 text-primary font-semibold"
                      : "text-foreground/85 hover:bg-panel-2 hover:text-foreground"
                  }`}
                >
                  {/* Color swatch */}
                  <span
                    className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/10 dark:border-white/20 shadow-sm"
                    style={{ backgroundColor: t.swatch }}
                  />
                  <span className="flex-1">{t.label}</span>
                  {active && (
                    <Check className="h-3 w-3 shrink-0 text-primary" strokeWidth={3} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
