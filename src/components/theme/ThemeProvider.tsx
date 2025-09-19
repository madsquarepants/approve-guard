// src/components/theme/ThemeProvider.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";
type Ctx = { theme: Theme; toggle: () => void; set: (t: Theme) => void };

const ThemeCtx = createContext<Ctx | undefined>(undefined);
const LS_KEY = "theme";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = (localStorage.getItem(LS_KEY) as Theme | null);
  if (stored === "light" || stored === "dark") return stored;
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

function applyThemeClass(t: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", t === "dark");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  // apply on mount & whenever theme changes
  useEffect(() => {
    applyThemeClass(theme);
    try {
      localStorage.setItem(LS_KEY, theme);
    } catch {}
  }, [theme]);

  const value = useMemo<Ctx>(
    () => ({
      theme,
      toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
      set: (t: Theme) => setTheme(t),
    }),
    [theme]
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

// SAFE: returns a fallback even if no provider (prevents app crash)
export function useTheme(): Ctx {
  const ctx = useContext(ThemeCtx);
  if (ctx) return ctx;

  // fallback that manipulates <html> directly; avoids hard crash
  const fallbackTheme: Theme =
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";

  return {
    theme: fallbackTheme,
    toggle: () => {
      if (typeof document === "undefined") return;
      const next = document.documentElement.classList.contains("dark") ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      try { localStorage.setItem(LS_KEY, next); } catch {}
    },
    set: (t: Theme) => {
      applyThemeClass(t);
      try { localStorage.setItem(LS_KEY, t); } catch {}
    },
  };
}
