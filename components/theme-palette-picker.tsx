"use client";

import { Check } from "lucide-react";

import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const palettes = [
  {
    value: "ocean",
    label: "Ocean",
    description: "Cool blue focus tones",
    swatches: ["bg-sky-500", "bg-cyan-400", "bg-blue-200"],
  },
  {
    value: "sunrise",
    label: "Sunrise",
    description: "Warm amber and sand",
    swatches: ["bg-amber-500", "bg-orange-400", "bg-yellow-200"],
  },
  {
    value: "forest",
    label: "Forest",
    description: "Calm green workspace",
    swatches: ["bg-emerald-500", "bg-lime-400", "bg-green-200"],
  },
] as const;

export function ThemePalettePicker() {
  const { palette, setPalette } = useTheme();

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {palettes.map((item) => {
        const selected = item.value === palette;

        return (
          <button
            key={item.value}
            type="button"
            onClick={() => setPalette(item.value)}
            className={cn(
              "rounded-[1.35rem] border bg-background/80 p-4 text-left transition-colors",
              selected
                ? "border-primary shadow-sm shadow-primary/10"
                : "border-border/70 hover:border-primary/40"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex size-6 items-center justify-center rounded-full border",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/70 bg-background text-transparent"
                )}
              >
                <Check className="size-3.5" />
              </span>
            </div>

            <div className="mt-4 flex items-center gap-2">
              {item.swatches.map((swatch) => (
                <span
                  key={swatch}
                  className={cn("size-6 rounded-full border border-white/50", swatch)}
                />
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}
