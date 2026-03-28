import { useEffect, useState } from "react";

const storageKey = "live-prd-color-mode";

function resolveTheme(theme) {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  return theme;
}

export function useThemePreference() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") {
      return "system";
    }

    return window.localStorage.getItem(storageKey) || "system";
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const resolved = resolveTheme(theme);
      document.documentElement.classList.toggle("dark", resolved === "dark");
    };

    applyTheme();
    window.localStorage.setItem(storageKey, theme);
    mediaQuery.addEventListener("change", applyTheme);

    return () => mediaQuery.removeEventListener("change", applyTheme);
  }, [theme]);

  return [theme, setTheme];
}
