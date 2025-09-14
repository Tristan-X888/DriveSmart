import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);
const STORAGE_KEY = "theme"; // "light" | "dark" | "system"

function getSystemTheme() {
  if (typeof window === "undefined") return "light";
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme) {
  const actual = theme === "system" ? getSystemTheme() : theme;
  const root = document.documentElement;
  root.classList.toggle("dark", actual === "dark");
  root.style.colorScheme = actual;
}

export function ThemeProvider({ defaultTheme = "system", children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || defaultTheme;
    } catch {
      return defaultTheme;
    }
  });

  // Apply on mount and when theme changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {}
    applyTheme(theme);
  }, [theme]);

  // Keep in sync with system preference when on "system"
  useEffect(() => {
    if (theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mql.addEventListener?.("change", handler);
    return () => mql.removeEventListener?.("change", handler);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,                // "light" | "dark" | "system"
      resolvedTheme: theme === "system" ? getSystemTheme() : theme, // actual applied
      setTheme,             // setTheme("light" | "dark" | "system")
      toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
