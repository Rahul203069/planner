"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  celebrationSoundOptions,
  type CelebrationSoundPreference,
} from "@/lib/celebration-sound";
import { playCelebrationSound } from "@/lib/celebration-sound-player";

type CelebrationSoundSettingsProps = {
  currentSound: CelebrationSoundPreference;
  updateCelebrationSound: (formData: FormData) => Promise<void>;
};

export function CelebrationSoundSettings({
  currentSound,
  updateCelebrationSound,
}: CelebrationSoundSettingsProps) {
  const [selectedSound, setSelectedSound] =
    React.useState<CelebrationSoundPreference>(currentSound);
  const stopPreviewRef = React.useRef<(() => void) | null>(null);

  React.useEffect(() => {
    return () => {
      stopPreviewRef.current?.();
    };
  }, []);

  function previewSound(sound: CelebrationSoundPreference) {
    stopPreviewRef.current?.();
    stopPreviewRef.current = playCelebrationSound(sound);
  }

  return (
    <form action={updateCelebrationSound} className="mt-5 space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <label
            htmlFor="celebration-sound"
            className="text-xs uppercase tracking-[0.18em] text-muted-foreground"
          >
            Sound preset
          </label>
          <Select
            id="celebration-sound"
            name="celebrationSound"
            value={selectedSound}
            onChange={(event) =>
              setSelectedSound(event.target.value as CelebrationSoundPreference)
            }
            className="mt-2 h-12 rounded-2xl bg-card"
          >
            {celebrationSoundOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <Button type="submit" className="h-12 rounded-2xl px-5">
          Save sound
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {celebrationSoundOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              setSelectedSound(option.value);
              previewSound(option.value);
            }}
            className={`rounded-2xl border p-4 text-left transition-colors ${
              selectedSound === option.value
                ? "border-primary bg-primary/8"
                : "border-border/70 bg-card hover:border-primary/40 hover:bg-muted/40"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-foreground">
                {option.label}
              </p>
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Preview
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {option.description}
            </p>
          </button>
        ))}
      </div>
    </form>
  );
}
