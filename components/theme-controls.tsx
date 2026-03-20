"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const presets = [
  { label: "Ocean", value: "ocean" },
  { label: "Sunrise", value: "sunrise" },
  { label: "Forest", value: "forest" },
] as const;

const modes = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "System", value: "system" },
] as const;

const storageKey = "plannerpro-theme-preset";

export function ThemeControls() {
  const { resolvedTheme, setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [preset, setPreset] = React.useState("ocean");

  React.useEffect(() => {
    const storedPreset = window.localStorage.getItem(storageKey) ?? "ocean";
    setPreset(storedPreset);
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) {
      return;
    }

    document.body.dataset.theme = preset;
    window.localStorage.setItem(storageKey, preset);
  }, [mounted, preset]);

  if (!mounted) {
    return null;
  }

  const activeMode = theme === "system" ? "system" : resolvedTheme;

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-card/80 p-5 shadow-lg shadow-black/5 backdrop-blur">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">Theme Controls</p>
        <p className="text-sm text-muted-foreground">
          Use mode for light/dark and preset for your product color system.
        </p>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
          Mode
        </p>
        <div className="flex flex-wrap gap-2">
          {modes.map((mode) => (
            <Button
              key={mode.value}
              type="button"
              variant={activeMode === mode.value ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme(mode.value)}
            >
              {mode.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
          Preset
        </p>
        <div className="flex flex-wrap gap-2">
          {presets.map((themePreset) => (
            <button
              key={themePreset.value}
              type="button"
              onClick={() => setPreset(themePreset.value)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-colors",
                preset === themePreset.value
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted"
              )}
            >
              <span
                className="size-2.5 rounded-full bg-primary"
                style={{
                  background:
                    themePreset.value === "sunrise"
                      ? "oklch(0.7 0.19 45)"
                      : themePreset.value === "forest"
                        ? "oklch(0.62 0.14 150)"
                        : "oklch(0.62 0.15 240)",
                }}
              />
              {themePreset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
