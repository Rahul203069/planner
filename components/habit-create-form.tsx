"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  createHabitAction,
  type HabitCreateActionState,
} from "@/app/habits/actions";
import { HabitPresetIcon } from "@/components/habit-preset-icon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { dayOptions, habitPresets, type HabitFrequency } from "@/lib/habits";

const frequencyOptions: Array<{
  value: HabitFrequency;
  label: string;
  description: string;
}> = [
  {
    value: "DAILY",
    label: "Daily",
    description: "Every day",
  },
  {
    value: "WEEKDAYS",
    label: "Weekdays",
    description: "Monday to Friday",
  },
  {
    value: "CUSTOM",
    label: "Custom days",
    description: "Pick your own weekly pattern",
  },
];

export function HabitCreateForm() {
  const router = useRouter();
  const initialHabitCreateActionState: HabitCreateActionState = {
    status: "idle",
    message: "",
    fieldErrors: {},
  };
  const [state, formAction, pending] = useActionState(
    createHabitAction,
    initialHabitCreateActionState
  );
  const [frequency, setFrequency] = useState<HabitFrequency>("DAILY");
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>(
    habitPresets[0].key
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    formRef.current?.reset();
    setFrequency("DAILY");
    setSelectedPresetKey(habitPresets[0].key);
    router.refresh();
  }, [router, state.status]);

  const selectedFrequency =
    frequencyOptions.find((option) => option.value === frequency) ??
    frequencyOptions[0];

  return (
    <form ref={formRef} action={formAction} className="mt-5 space-y-5">
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-foreground">Habit option</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Pick from a focused set instead of typing custom habits.
          </p>
        </div>

        <div className="grid gap-3">
          {habitPresets.map((preset) => {
            const selected = selectedPresetKey === preset.key;

            return (
              <label
                key={preset.key}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-4 transition-colors",
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-border/70 bg-card hover:bg-background"
                )}
              >
                <input
                  type="radio"
                  name="presetKey"
                  value={preset.key}
                  checked={selected}
                  onChange={() => setSelectedPresetKey(preset.key)}
                  disabled={pending}
                  className="mt-1 size-4"
                />
                <div
                  className={cn(
                    "rounded-2xl p-3",
                    preset.iconClassName
                  )}
                >
                  <HabitPresetIcon icon={preset.icon} className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {preset.name}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {preset.description}
                  </p>
                </div>
              </label>
            );
          })}
        </div>

        {state.fieldErrors.presetKey ? (
          <p className="text-sm text-destructive" aria-live="polite">
            {state.fieldErrors.presetKey[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="habit-frequency"
          className="text-sm font-medium text-foreground"
        >
          Frequency
        </label>
        <input type="hidden" name="frequency" value={frequency} />
        <DropdownMenu>
          <DropdownMenuTrigger
            id="habit-frequency"
            type="button"
            disabled={pending}
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
              state.fieldErrors.frequency && "border-destructive"
            )}
            aria-invalid={state.fieldErrors.frequency ? true : undefined}
          >
            <span className="flex flex-col items-start">
              <span>{selectedFrequency.label}</span>
              <span className="text-xs text-muted-foreground">
                {selectedFrequency.description}
              </span>
            </span>
            <ChevronDown className="size-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[var(--anchor-width)]">
            {frequencyOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setFrequency(option.value)}
                className="items-start justify-between gap-3"
              >
                <span className="flex flex-col items-start">
                  <span className="font-medium text-foreground">{option.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {option.description}
                  </span>
                </span>
                {frequency === option.value ? (
                  <Check className="mt-0.5 size-4 text-primary" />
                ) : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {state.fieldErrors.frequency ? (
          <p className="text-sm text-destructive" aria-live="polite">
            {state.fieldErrors.frequency[0]}
          </p>
        ) : null}
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">Custom days</p>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {dayOptions.map((day) => (
            <label
              key={day.value}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm",
                frequency === "CUSTOM"
                  ? "border-border/70 bg-card text-foreground"
                  : "border-border/50 bg-muted/40 text-muted-foreground"
              )}
            >
              <input
                type="checkbox"
                name="activeDays"
                value={day.value}
                disabled={frequency !== "CUSTOM" || pending}
                className="size-4 rounded border-border"
              />
              <span>{day.shortLabel}</span>
            </label>
          ))}
        </div>
        {state.fieldErrors.activeDays ? (
          <p className="text-sm text-destructive" aria-live="polite">
            {state.fieldErrors.activeDays[0]}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            These only apply when frequency is set to custom.
          </p>
        )}
      </div>

      <div className="space-y-2">
        {state.message ? (
          <p
            className={
              state.status === "success"
                ? "text-sm text-emerald-700 dark:text-emerald-300"
                : "text-sm text-destructive"
            }
            aria-live="polite"
          >
            {state.message}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={pending}>
          <Plus className="size-4" />
          {pending ? "Creating..." : "Create Habit"}
        </Button>
      </div>
    </form>
  );
}
