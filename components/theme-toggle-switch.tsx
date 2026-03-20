"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/components/theme-provider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export function ThemeToggleSwitch({ compact = false }: { compact?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const checked = resolvedTheme === "dark";

  return (
    <div
      className={cn(
        "flex items-center rounded-full border border-border/70 bg-background/80 shadow-sm shadow-black/5 backdrop-blur",
        compact ? "justify-center gap-2 px-2 py-2" : "gap-3 px-3 py-2"
      )}
    >
      {!compact ? <Sun className="size-4 text-muted-foreground" /> : null}
      <Switch
        checked={checked}
        onCheckedChange={(nextChecked) => setTheme(nextChecked ? "dark" : "light")}
        aria-label="Toggle theme"
      />
      {!compact ? <Moon className="size-4 text-muted-foreground" /> : null}
    </div>
  );
}
