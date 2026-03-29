"use client";

import * as React from "react";
import { Clock3, Lock, Sparkles } from "lucide-react";

type TimelineClassBlock = {
  id?: string;
  title: string;
  time: string;
  meta: string;
  startMinutes: number;
  durationMinutes: number;
  type: "class" | "task";
  status?: "OPEN" | "COMPLETED" | "FAILED";
  failureReason?: string | null;
};

type TimelineBreakBlock = {
  id: string;
  title: string;
  startMinutes: number;
  durationMinutes: number;
};

type TimelineSlot = {
  value: string;
  label: string;
};

const HOUR_HEIGHT = 72;

function blockClassName(
  type: "class" | "task",
  status?: "OPEN" | "COMPLETED" | "FAILED"
) {
  if (type === "class") {
    return "border border-border/80 bg-muted/75 text-foreground";
  }

  if (status === "COMPLETED") {
    return "border border-emerald-500/30 bg-emerald-500/12 text-foreground shadow-sm shadow-emerald-500/10";
  }

  if (status === "FAILED") {
    return "border border-destructive/30 bg-destructive/10 text-foreground shadow-sm shadow-destructive/10";
  }

  return "border border-primary/25 bg-primary/12 text-foreground shadow-sm shadow-primary/10";
}

function formatMinutesToTwelveHour(totalMinutes: number): string {
  const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalizedMinutes / 60);
  const minutes = normalizedMinutes % 60;
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;

  return `${displayHour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function getCurrentMinutesInIndia() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Kolkata",
  }).formatToParts(now);

  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");

  return hour * 60 + minute;
}

type PlannerTimelineProps = {
  breakBlocks: TimelineBreakBlock[];
  classBlocks: TimelineClassBlock[];
  dayName: string;
  isCurrentDay: boolean;
  timeSlots: TimelineSlot[];
};

export function PlannerTimeline({
  breakBlocks,
  classBlocks,
  dayName,
  isCurrentDay,
  timeSlots,
}: PlannerTimelineProps) {
  const [currentMinutes, setCurrentMinutes] = React.useState(() =>
    getCurrentMinutesInIndia()
  );

  React.useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentMinutes(getCurrentMinutesInIndia());
    }, 60_000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Daily Timeline
          </p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">
            {dayName} around your classes
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/70 px-3 py-1">
            <Lock className="size-3.5" />
            Fixed classes
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-border/70 px-3 py-1">
            <Sparkles className="size-3.5" />
            Saved tasks
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-border/70 px-3 py-1">
            <div className="h-2 w-6 rounded-full bg-amber-500/70" />
            Breaks
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-border/70 px-3 py-1">
            <Clock3 className="size-3.5" />
            Free blocks
          </span>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-border/70 bg-card">
        <div className="max-h-[720px] overflow-y-auto p-3">
          <div className="relative">
            {timeSlots.map((slot, index) => (
              <div
                key={slot.value}
                className="flex h-[72px] items-start border-t border-border/70 first:border-t-0"
              >
                <div className="w-20 shrink-0 px-3 pt-2 text-xs text-muted-foreground">
                  {slot.label}
                </div>
                <div className="relative flex flex-1 items-start justify-between px-3 pt-2 text-left">
                  <div className="text-[11px] text-muted-foreground/70">
                    {index === 12 ? "Classes end soon. Good slot for light work." : null}
                    {index === 18 ? "Best focus zone starts here." : null}
                  </div>
                </div>
              </div>
            ))}

            {isCurrentDay ? (
              <div
                className="pointer-events-none absolute left-0 right-3 z-20 flex items-center gap-2"
                style={{
                  top: `${(currentMinutes / 60) * HOUR_HEIGHT + 6}px`,
                }}
              >
                <span className="inline-flex rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                  {formatMinutesToTwelveHour(currentMinutes)}
                </span>
                <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500 shadow-[0_0_0_3px_rgba(239,68,68,0.18)]" />
                <div className="h-px flex-1 bg-red-500" />
              </div>
            ) : null}

            {classBlocks.map((block) => (
              <div
                key={block.id ?? `${block.type}-${block.title}-${block.startMinutes}`}
                className={`absolute left-[5.5rem] right-3 overflow-hidden rounded-2xl p-3 ${blockClassName(block.type, block.status)}`}
                style={{
                  top: `${(block.startMinutes / 60) * HOUR_HEIGHT + 6}px`,
                  height: `${(block.durationMinutes / 60) * HOUR_HEIGHT - 4}px`,
                }}
              >
                <div className="flex h-full min-w-0 items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="break-words text-xs font-semibold leading-4">
                      {block.title}
                    </p>
                    <p className="mt-1 truncate text-[11px] opacity-80">{block.time}</p>
                  </div>
                  {block.type === "class" ? (
                    <Lock className="mt-0.5 size-3.5 shrink-0 opacity-70" />
                  ) : block.status ? (
                    <span
                      className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        block.status === "COMPLETED"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          : block.status === "FAILED"
                            ? "bg-destructive/15 text-destructive"
                            : "bg-primary/15 text-primary"
                      }`}
                    >
                      {block.status === "COMPLETED"
                        ? "Completed"
                        : block.status === "FAILED"
                          ? "Failed"
                          : "Open"}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 truncate text-[11px] opacity-80">{block.meta}</p>
                {block.type === "task" &&
                block.status === "FAILED" &&
                block.failureReason ? (
                  <p className="mt-1 break-words text-[11px] leading-4 opacity-80">
                    Reason: {block.failureReason}
                  </p>
                ) : null}
              </div>
            ))}

            {breakBlocks.map((block) => (
              <div
                key={block.id}
                className="pointer-events-none absolute left-[5.9rem] right-7 z-10 overflow-hidden rounded-full border border-amber-500/40 bg-amber-500/45 shadow-sm shadow-amber-500/20"
                style={{
                  top: `${(block.startMinutes / 60) * HOUR_HEIGHT + 12}px`,
                  height: `${Math.max(
                    6,
                    (block.durationMinutes / 60) * HOUR_HEIGHT - 8
                  )}px`,
                }}
                title={`${block.title} (${formatMinutesToTwelveHour(
                  block.startMinutes
                )} - ${formatMinutesToTwelveHour(
                  block.startMinutes + block.durationMinutes
                )})`}
              />
            ))}

            {classBlocks.length === 0 ? (
              <div className="absolute inset-x-[5.5rem] top-6 rounded-2xl border border-dashed border-border/80 bg-background/80 p-4 text-sm text-muted-foreground">
                No classes or saved tasks for {dayName}. Use quick add to place work
                into your day.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
