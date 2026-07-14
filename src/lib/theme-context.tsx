/**
 * theme-context.tsx
 *
 * Provides a global theme that's persisted to localStorage.
 * Applies a CSS class to <html> that overrides all CSS custom properties.
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type ThemeId = "dark" | "black" | "emerald" | "violet" | "light";

export interface Theme {
  id: ThemeId;
  label: string;
  /** Swatch colors shown in the picker */
  swatch: string;
  /** CSS class applied to <html>. "dark" is the base; others also need dark reset. */
  htmlClass: string;
}

export const THEMES: Theme[] = [
  {
    id: "dark",
    label: "Midnight Blue",
    swatch: "#3B82F6",
    htmlClass: "dark",
  },
  {
    id: "black",
    label: "Jet Black",
    swatch: "#1A1A1A",
    htmlClass: "dark theme-black",
  },
  {
    id: "emerald",
    label: "Emerald",
    swatch: "#10B981",
    htmlClass: "dark theme-emerald",
  },
  {
    id: "violet",
    label: "Violet",
    swatch: "#8B5CF6",
    htmlClass: "dark theme-violet",
  },
  {
    id: "light",
    label: "Light",
    swatch: "#E5E9F4",
    htmlClass: "theme-light",
  },
];

const STORAGE_KEY = "forecastiq-theme";

interface ThemeCtx {
  theme: Theme;
  setTheme: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    try {
      return (localStorage.getItem(STORAGE_KEY) as ThemeId) || "dark";
    } catch {
      return "dark";
    }
  });

  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];

  useEffect(() => {
    const html = document.documentElement;
    // Remove all theme classes
    THEMES.forEach((t) => {
      t.htmlClass.split(" ").forEach((cls) => html.classList.remove(cls));
    });
    // Apply active theme classes
    theme.htmlClass.split(" ").forEach((cls) => html.classList.add(cls));
    try {
      localStorage.setItem(STORAGE_KEY, themeId);
    } catch {
      // ignore
    }
  }, [theme, themeId]);

  const setTheme = (id: ThemeId) => setThemeId(id);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
