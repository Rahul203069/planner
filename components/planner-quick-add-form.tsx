"use client";

import * as React from "react";
import { Brain, BriefcaseBusiness, NotebookPen } from "lucide-react";
import { toast } from "sonner";

import { PlannerQuickAddSubmitButton } from "@/components/planner-quick-add-submit-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

type OccupiedRange = {
  type: "class" | "task";
  title: string;
  startMinutes: number;
  durationMinutes: number;
};

type PlannerCategory = {
  value: string;
  label: string;
  description: string;
  icon: "briefcase" | "brain" | "notebook";
  className: string;
};

type PlannerQuickAddFormProps = {
  categories: readonly PlannerCategory[];
  occupiedRanges: OccupiedRange[];
  isSelectedDateToday: boolean;
  addQuickTaskAction: (
    previousState: ActionState,
    formData: FormData
  ) => Promise<ActionState>;
  onOptimisticAdd: (task: {
    id: string;
    title: string;
    category: "SAAS" | "DSA" | "CLASSWORK";
    status: "OPEN";
    failureReason: null;
    startMinutes: number;
    durationMinutes: number;
    pausedAtMinute: null;
    breaks: [];
  }) => void;
  onOptimisticRemove: (taskId: string) => void;
};

type OptimisticTask = Parameters<PlannerQuickAddFormProps["onOptimisticAdd"]>[0];

type PendingConfirmation =
  | {
      type: "class-overlap";
      overlap: OccupiedRange;
    }
  | {
      type: "past-time";
      currentTimeLabel: string;
      selectedTimeLabel: string;
    };

type ConfirmationOverrides = {
  allowClassOverlap?: boolean;
  allowPastTime?: boolean;
};

type QueuedSubmission = {
  formData: FormData;
  overrides: ConfirmationOverrides;
};

const categoryIcons = {
  briefcase: BriefcaseBusiness,
  brain: Brain,
  notebook: NotebookPen,
} satisfies Record<PlannerCategory["icon"], React.ComponentType<{ className?: string }>>;

function parseTimeToMinutes(value: string): number | null {
  const match = value.match(/^(\d{2}):(\d{2})$/);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

function rangesOverlap(
  startMinutes: number,
  durationMinutes: number,
  occupiedRanges: OccupiedRange[]
) {
  const endMinutes = startMinutes + durationMinutes;

  return occupiedRanges.find((range) => {
    const rangeEnd = range.startMinutes + range.durationMinutes;
    return startMinutes < rangeEnd && endMinutes > range.startMinutes;
  });
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

function formatMinutesToTwelveHour(totalMinutes: number): string {
  const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalizedMinutes / 60);
  const minutes = normalizedMinutes % 60;
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;

  return `${displayHour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function cloneFormData(source: FormData) {
  const next = new FormData();

  for (const [key, value] of source.entries()) {
    next.append(key, value);
  }

  return next;
}

export function PlannerQuickAddForm({
  categories,
  occupiedRanges,
  isSelectedDateToday,
  addQuickTaskAction,
  onOptimisticAdd,
  onOptimisticRemove,
}: PlannerQuickAddFormProps) {
  const formRef = React.useRef<HTMLFormElement | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const [pendingConfirmation, setPendingConfirmation] =
    React.useState<PendingConfirmation | null>(null);
  const [queuedSubmission, setQueuedSubmission] = React.useState<QueuedSubmission | null>(null);

  function submitQuickAdd(
    formData: FormData,
    overrides: ConfirmationOverrides = {}
  ) {
    if (overrides?.allowClassOverlap) {
      formData.set("allowClassOverlap", "true");
    } else {
      formData.delete("allowClassOverlap");
    }

    if (overrides?.allowPastTime) {
      formData.set("allowPastTime", "true");
    } else {
      formData.delete("allowPastTime");
    }

    const title = formData.get("title");
    const startTime = formData.get("startTime");
    const endTime = formData.get("endTime");

    if (
      typeof title !== "string" ||
      typeof startTime !== "string" ||
      typeof endTime !== "string"
    ) {
      toast.error("Add a title, start time, and end time.");
      return;
    }

    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);
    const currentMinutes = getCurrentMinutesInIndia();

    if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
      toast.error("End time must be after start time.");
      return;
    }

    if (isSelectedDateToday && startMinutes <= currentMinutes && !overrides?.allowPastTime) {
      setPendingConfirmation({
        type: "past-time",
        currentTimeLabel: formatMinutesToTwelveHour(currentMinutes),
        selectedTimeLabel: formatMinutesToTwelveHour(startMinutes),
      });
      setQueuedSubmission({
        formData: cloneFormData(formData),
        overrides: { ...overrides },
      });
      return;
    }

    const overlappingRange = rangesOverlap(
      startMinutes,
      endMinutes - startMinutes,
      occupiedRanges
    );

    if (overlappingRange) {
      if (overlappingRange.type === "task") {
        toast.error(`This overlaps with "${overlappingRange.title}".`);
        return;
      }

      if (!overrides?.allowClassOverlap) {
        setPendingConfirmation({
          type: "class-overlap",
          overlap: overlappingRange,
        });
        setQueuedSubmission({
          formData: cloneFormData(formData),
          overrides: { ...overrides },
        });
        return;
      }
    }

    startTransition(async () => {
      const categoryValue = formData.get("category");
      const optimisticTaskId = `optimistic-${crypto.randomUUID()}`;
      const optimisticTask: OptimisticTask = {
        id: optimisticTaskId,
        title: title.trim(),
        category:
          categoryValue === "dsa"
            ? "DSA"
            : categoryValue === "classwork"
              ? "CLASSWORK"
              : "SAAS",
        status: "OPEN" as const,
        failureReason: null,
        startMinutes,
        durationMinutes: endMinutes - startMinutes,
        pausedAtMinute: null,
        breaks: [],
      };

      onOptimisticAdd(optimisticTask);

      try {
        const result = await addQuickTaskAction(
          { status: "idle", message: "" },
          formData
        );

        if (result.status === "success") {
          toast.success(result.message);
          formRef.current?.reset();
          return;
        }

        onOptimisticRemove(optimisticTaskId);
        toast.error(result.message);
      } catch {
        onOptimisticRemove(optimisticTaskId);
        toast.error("Could not add the task. Check the fields and try again.");
      }
    });
  }

  function handleQuickAdd(formData: FormData) {
    submitQuickAdd(formData);
  }

  return (
    <>
      <form ref={formRef} action={handleQuickAdd} className="mt-5 space-y-4">
        <div className="rounded-2xl border border-border/70 bg-card px-4 py-3">
          <label
            htmlFor="quick-task-title"
            className="text-xs uppercase tracking-[0.18em] text-muted-foreground"
          >
            Title
          </label>
          <Input
            id="quick-task-title"
            name="title"
            type="text"
            minLength={3}
            required
            placeholder="Prepare DBMS revision questions"
            className="mt-2 border-0 bg-transparent px-0 py-0 text-sm shadow-none focus-visible:ring-0"
          />
        </div>

        <fieldset className="space-y-3">
          <legend className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Category
          </legend>
          <div className="grid gap-3">
            {categories.map((category) => {
              const Icon = categoryIcons[category.icon];

              return (
                <label
                  key={category.value}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <input
                    type="radio"
                    name="category"
                    value={category.value}
                    defaultChecked={category.value === "saas"}
                    className="size-4 accent-primary"
                  />
                  <span
                    className={`inline-flex size-10 items-center justify-center rounded-full ${category.className}`}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground">
                      {category.label}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {category.description}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-card px-4 py-3">
            <label
              htmlFor="quick-task-start-time"
              className="text-xs uppercase tracking-[0.18em] text-muted-foreground"
            >
              Start time
            </label>
            <Input
              id="quick-task-start-time"
              name="startTime"
              type="time"
              defaultValue="18:00"
              className="mt-2 border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0"
            />
          </div>

          <div className="rounded-2xl border border-border/70 bg-card px-4 py-3">
            <label
              htmlFor="quick-task-end-time"
              className="text-xs uppercase tracking-[0.18em] text-muted-foreground"
            >
              End time
            </label>
            <Input
              id="quick-task-end-time"
              name="endTime"
              type="time"
              defaultValue="19:00"
              className="mt-2 border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0"
            />
          </div>
        </div>

        <PlannerQuickAddSubmitButton pendingOverride={isPending} />
      </form>

      <Dialog
        open={pendingConfirmation !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingConfirmation(null);
            setQueuedSubmission(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingConfirmation?.type === "past-time"
                ? "This task starts in the past"
                : "Class overlap detected"}
            </DialogTitle>
            <DialogDescription>
              {pendingConfirmation?.type === "past-time"
                ? `This task starts at ${pendingConfirmation.selectedTimeLabel}, and the current time is ${pendingConfirmation.currentTimeLabel}. Continue only if you already started the work and forgot to log it.`
                : `This task overlaps with "${pendingConfirmation?.overlap.title}". You may have skipped that class, so continue only if you still want to schedule this task.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPendingConfirmation(null);
                setQueuedSubmission(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!queuedSubmission || !pendingConfirmation) {
                  return;
                }

                const nextOverrides: ConfirmationOverrides = {
                  ...queuedSubmission.overrides,
                  allowClassOverlap:
                    queuedSubmission.overrides.allowClassOverlap ||
                    pendingConfirmation.type === "class-overlap",
                  allowPastTime:
                    queuedSubmission.overrides.allowPastTime ||
                    pendingConfirmation.type === "past-time",
                };
                const nextFormData = cloneFormData(queuedSubmission.formData);
                setPendingConfirmation(null);
                setQueuedSubmission(null);
                submitQuickAdd(nextFormData, nextOverrides);
              }}
            >
              Add anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
