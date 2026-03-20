"use client";

import * as React from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";
type Palette = "ocean" | "sunrise" | "forest";

type ThemeContextValue = {
  palette: Palette;
  resolvedTheme: ResolvedTheme;
  setPalette: (palette: Palette) => void;
  setTheme: (theme: Theme) => void;
  theme: Theme;
};

const themeStorageKey = "theme";
const paletteStorageKey = "palette";
const mediaQuery = "(prefers-color-scheme: dark)";

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme() {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia(mediaQuery).matches ? "dark" : "light";
}

function applyTheme(theme: ResolvedTheme) {
  const root = document.documentElement;

  root.classList.remove("light", "dark");
  root.classList.add(theme);
  root.style.colorScheme = theme;
}

function applyPalette(palette: Palette) {
  document.body.setAttribute("data-theme", palette);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("system");
  const [palette, setPaletteState] = React.useState<Palette>("ocean");
  const [resolvedTheme, setResolvedTheme] =
    React.useState<ResolvedTheme>("light");

  React.useEffect(() => {
    const storedTheme = window.localStorage.getItem(themeStorageKey);
    const initialTheme =
      storedTheme === "light" || storedTheme === "dark" || storedTheme === "system"
        ? storedTheme
        : "system";
    const storedPalette = window.localStorage.getItem(paletteStorageKey);
    const initialPalette =
      storedPalette === "ocean" ||
      storedPalette === "sunrise" ||
      storedPalette === "forest"
        ? storedPalette
        : "ocean";

    setThemeState(initialTheme);
    setPaletteState(initialPalette);
  }, []);

  React.useEffect(() => {
    const media = window.matchMedia(mediaQuery);

    const updateTheme = () => {
      const nextResolvedTheme = theme === "system" ? getSystemTheme() : theme;
      setResolvedTheme(nextResolvedTheme);
      applyTheme(nextResolvedTheme);
    };

    updateTheme();
    media.addEventListener("change", updateTheme);

    return () => {
      media.removeEventListener("change", updateTheme);
    };
  }, [theme]);

  React.useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === themeStorageKey) {
        const nextTheme =
          event.newValue === "light" ||
          event.newValue === "dark" ||
          event.newValue === "system"
            ? event.newValue
            : "system";

        setThemeState(nextTheme);
      }

      if (event.key === paletteStorageKey) {
        const nextPalette =
          event.newValue === "ocean" ||
          event.newValue === "sunrise" ||
          event.newValue === "forest"
            ? event.newValue
            : "ocean";

        setPaletteState(nextPalette);
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  React.useEffect(() => {
    applyPalette(palette);
  }, [palette]);

  const setTheme = React.useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme);
    window.localStorage.setItem(themeStorageKey, nextTheme);
  }, []);

  const setPalette = React.useCallback((nextPalette: Palette) => {
    setPaletteState(nextPalette);
    window.localStorage.setItem(paletteStorageKey, nextPalette);
  }, []);

  const value = React.useMemo(
    () => ({
      palette,
      resolvedTheme,
      setPalette,
      setTheme,
      theme,
    }),
    [palette, resolvedTheme, setPalette, setTheme, theme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
