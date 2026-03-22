import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  Plus,
} from "lucide-react";

import { auth } from "@/auth";
import { AppSidebar } from "@/components/app-sidebar";
import { PlannerDatePicker } from "@/components/planner-date-picker";
import { PlannerToastListener } from "@/components/planner-toast-listener";
import { PlannerWorkspace } from "@/components/planner-workspace";
import { Button } from "@/components/ui/button";
import type { CelebrationSoundPreference } from "@/lib/celebration-sound";
import { prisma } from "@/lib/prisma";

type TimetableClass = {
  subject: string;
  start_time: string;
  end_time: string;
  uncertain?: boolean | null;
  note?: string | null;
};

type TimetableData = {
  days?: Record<string, TimetableClass[]>;
  meta?: {
    lunch_break?: {
      start_time: string;
      end_time: string;
    } | null;
    parser_rules_applied?: string[];
  };
};

type TimelineBlock = {
  id?: string;
  title: string;
  time: string;
  meta: string;
  startMinutes: number;
  durationMinutes: number;
  type: "class" | "task";
};

type ActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

type PlannerTask = {
  id: string;
  title: string;
  category: "SAAS" | "DSA" | "CLASSWORK";
  status: "OPEN" | "COMPLETED" | "FAILED";
  failureReason: string | null;
  startMinutes: number;
  durationMinutes: number;
};

type OccupiedRange = {
  title: string;
  startMinutes: number;
  durationMinutes: number;
};

const plannerCategories = [
  {
    value: "saas",
    label: "SaaS",
    description: "Product, growth, shipping",
    icon: "briefcase",
    className: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
  },
  {
    value: "dsa",
    label: "DSA",
    description: "Practice and problem solving",
    icon: "brain",
    className: "bg-violet-500/12 text-violet-700 dark:text-violet-300",
  },
  {
    value: "classwork",
    label: "Classwork",
    description: "Assignments, revision, labs",
    icon: "notebook",
    className: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  },
] as const;

const basePlannerSummary = {
  freeToday: "5h 20m",
  plannedHours: "0h",
};

const timeSlots = [
  "00:00",
  "01:00",
  "02:00",
  "03:00",
  "04:00",
  "05:00",
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00",
];

function parseTimeToMinutes(value: string): number | null {
  const normalized = value.trim().toUpperCase();
  const match = normalized.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/);

  if (!match) {
    return null;
  }

  const [, hourValue, minuteValue, meridiem] = match;
  let hours = Number(hourValue);
  const minutes = Number(minuteValue);

  if (Number.isNaN(hours) || Number.isNaN(minutes) || minutes > 59) {
    return null;
  }

  if (meridiem) {
    if (hours < 1 || hours > 12) {
      return null;
    }

    if (meridiem === "AM") {
      hours = hours % 12;
    } else {
      hours = hours % 12 + 12;
    }
  } else if (hours > 23) {
    return null;
  }

  return hours * 60 + minutes;
}

function formatMinutesToTwelveHour(totalMinutes: number): string {
  const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalizedMinutes / 60);
  const minutes = normalizedMinutes % 60;
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;

  return `${displayHour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function formatTimeValue(value: string): string {
  const minutes = parseTimeToMinutes(value);

  if (minutes === null) {
    return value;
  }

  return formatMinutesToTwelveHour(minutes);
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

function findOverlappingRange(
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

function isValidDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function getPlannerDateMetadata(targetDateKey?: string) {
  const now = new Date();
  const todayDateKey = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Kolkata",
  }).format(now);
  const effectiveDateKey =
    targetDateKey && isValidDateKey(targetDateKey) ? targetDateKey : todayDateKey;
  const [yearValue, monthValue, dayValue] = effectiveDateKey.split("-");
  const plannerDate = new Date(
    Date.UTC(Number(yearValue), Number(monthValue) - 1, Number(dayValue), 12)
  );
  const dayName = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: "Asia/Kolkata",
  }).format(plannerDate);
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(plannerDate);

  return { dayName, dateKey: effectiveDateKey, dateLabel, todayDateKey };
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

type PlannerPageProps = {
  searchParams?: Promise<{
    date?: string;
    status?: string;
    message?: string;
  }>;
};

export default async function PlannerPage({ searchParams }: PlannerPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin/google?callbackUrl=%2Fplanner");
  }

  if (!session.user.email) {
    throw new Error("Authenticated user is missing an email address.");
  }

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
    select: {
      id: true,
      email: true,
      name: true,
      selectedGroup: true,
      celebrationSound: true,
      hasCompletedTimetableOnboarding: true,
      timetable: true,
    },
  });

  if (!user) {
    throw new Error("Authenticated user record was not found.");
  }

  const userId = user.id;
  const userEmail = user.email;
  const userName = user.name;
  const userTimetable = user.timetable;
  const celebrationSound = user.celebrationSound as CelebrationSoundPreference;
  const hasCompletedTimetableOnboarding = user.hasCompletedTimetableOnboarding;

  if (!hasCompletedTimetableOnboarding || !userTimetable) {
    redirect("/app");
  }

  const timetable = userTimetable as TimetableData;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const requestedDate = resolvedSearchParams?.date;
  const { dayName, dateKey, dateLabel, todayDateKey } =
    getPlannerDateMetadata(requestedDate);
  const isSelectedDateToday = dateKey === todayDateKey;
  const todaysClasses = (timetable.days?.[dayName] ?? []).filter((entry) => {
    const startMinutes = parseTimeToMinutes(entry.start_time);
    const endMinutes = parseTimeToMinutes(entry.end_time);

    return startMinutes !== null && endMinutes !== null && endMinutes > startMinutes;
  });

  const classBlocks: TimelineBlock[] = todaysClasses.map((entry) => {
    const startMinutes = parseTimeToMinutes(entry.start_time) ?? 0;
    const endMinutes = parseTimeToMinutes(entry.end_time) ?? startMinutes + 60;

    return {
      title: entry.subject,
      time: `${formatTimeValue(entry.start_time)} - ${formatTimeValue(entry.end_time)}`,
      meta: entry.uncertain ? "Fixed class | uncertain" : "Fixed class",
      startMinutes,
      durationMinutes: endMinutes - startMinutes,
      type: "class",
    };
  });

  const tasks: PlannerTask[] = await prisma.task.findMany({
    where: {
      userId,
      scheduledDate: dateKey,
    },
    orderBy: {
      startMinutes: "asc",
    },
  });

  const occupiedRanges: OccupiedRange[] = classBlocks.map((block) => ({
    title: block.title,
    startMinutes: block.startMinutes,
    durationMinutes: block.durationMinutes,
  }));

  const totalClassMinutes = classBlocks.reduce(
    (sum, block) => sum + block.durationMinutes,
    0
  );
  const status = resolvedSearchParams?.status === "error" ? "error" : resolvedSearchParams?.status === "success" ? "success" : null;
  const message = resolvedSearchParams?.message;

  async function updateTaskStatus(formData: FormData) {
    "use server";

    const taskId = formData.get("taskId");
    const nextStatus = formData.get("status");
    const failureReason = formData.get("failureReason");

    if (
      typeof taskId !== "string" ||
      typeof nextStatus !== "string" ||
      !["OPEN", "COMPLETED", "FAILED"].includes(nextStatus)
    ) {
      throw new Error("Invalid task status request.");
    }

    const normalizedFailureReason =
      typeof failureReason === "string" ? failureReason.trim() : "";

    if (nextStatus === "FAILED" && normalizedFailureReason.length < 3) {
      throw new Error("Add a short reason before marking this task as failed.");
    }

    await prisma.task.update({
      where: {
        id: taskId,
        userId,
      },
      data: {
        status: nextStatus as "OPEN" | "COMPLETED" | "FAILED",
        failureReason:
          nextStatus === "FAILED" ? normalizedFailureReason : null,
      },
    });

    revalidatePath("/planner");
  }

  async function deleteTask(formData: FormData) {
    "use server";

    const taskId = formData.get("taskId");

    if (typeof taskId !== "string") {
      throw new Error("Invalid task delete request.");
    }

    await prisma.task.delete({
      where: {
        id: taskId,
        userId,
      },
    });

    revalidatePath("/planner");
  }

  async function extendTaskDuration(formData: FormData) {
    "use server";

    const taskId = formData.get("taskId");
    const minutesValue = formData.get("minutes");

    if (typeof taskId !== "string" || typeof minutesValue !== "string") {
      throw new Error("Invalid task duration update request.");
    }

    const extraMinutes = Number(minutesValue);

    if (!Number.isInteger(extraMinutes) || extraMinutes === 0) {
      throw new Error("Invalid task extension amount.");
    }

    const existingTask = await prisma.task.findUnique({
      where: {
        id: taskId,
        userId,
      },
      select: {
        durationMinutes: true,
      },
    });

    if (!existingTask) {
      throw new Error("Task not found.");
    }

    const nextDuration = existingTask.durationMinutes + extraMinutes;

    if (nextDuration < 10) {
      throw new Error("Task duration cannot be less than 10 minutes.");
    }

    await prisma.task.update({
      where: {
        id: taskId,
        userId,
      },
      data: {
        durationMinutes: nextDuration,
      },
    });

    revalidatePath("/planner");
  }

  async function addQuickTask(
    _previousState: ActionState,
    formData: FormData
  ): Promise<ActionState> {
    "use server";

    const title = formData.get("title");
    const category = formData.get("category");
    const startTime = formData.get("startTime");
    const endTime = formData.get("endTime");

    if (
      typeof title !== "string" ||
      title.trim().length < 3 ||
      typeof category !== "string" ||
      !plannerCategories.some((item) => item.value === category) ||
      typeof startTime !== "string" ||
      parseTimeToMinutes(startTime) === null ||
      typeof endTime !== "string" ||
      parseTimeToMinutes(endTime) === null
    ) {
      return {
        status: "error",
        message: "Add a title, category, start time, and end time.",
      };
    }

    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);

    if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
      return {
        status: "error",
        message: "End time must be after start time.",
      };
    }

    if (isSelectedDateToday && startMinutes <= getCurrentMinutesInIndia()) {
      return {
        status: "error",
        message: "Choose a future time slot after the current time.",
      };
    }

    const overlappingRange = findOverlappingRange(
      startMinutes,
      endMinutes - startMinutes,
      occupiedRanges
    );

    if (overlappingRange) {
      return {
        status: "error",
        message: `This overlaps with "${overlappingRange.title}".`,
      };
    }

    await prisma.task.create({
      data: {
        userId,
        title: title.trim(),
        category:
          category === "saas"
            ? "SAAS"
            : category === "dsa"
              ? "DSA"
              : "CLASSWORK",
        scheduledDate: dateKey,
        startMinutes,
        durationMinutes: endMinutes - startMinutes,
      },
    });

    revalidatePath("/planner");

    return {
      status: "success",
      message: `Added "${title.trim()}" from ${formatTimeValue(startTime)} to ${formatTimeValue(endTime)}.`,
    };
  }

  return (
    <main className="flex min-h-screen w-full flex-col bg-background lg:flex-row">
      <AppSidebar email={userEmail} />

      <section className="flex-1 p-6 lg:p-10">
        <div className="rounded-[2rem] border border-border/70 bg-card/85 p-6 shadow-xl shadow-black/5 backdrop-blur lg:p-8">
          <PlannerToastListener status={status} message={message} />

          <div className="flex flex-col gap-4 border-b border-border/70 pb-6">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                  Planner
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                  Daily task planner
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Hi {userName ?? "there"}, focus on today first and fit work around
                  your fixed classes.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <PlannerDatePicker
                  selectedDate={dateKey}
                  selectedDateLabel={dateLabel}
                  todayDate={todayDateKey}
                />
                <Button size="sm">
                  <Plus className="size-4" />
                  Add Task
                </Button>
                <Button variant="outline" size="sm">
                  Edit Timetable
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[1.25rem] border border-border/70 bg-background/80 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Today
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {dateLabel}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-border/70 bg-background/80 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Free time
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {basePlannerSummary.freeToday}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-border/70 bg-background/80 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Planned
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {basePlannerSummary.plannedHours}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-border/70 bg-background/80 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Classes today
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {classBlocks.length > 0
                    ? `${classBlocks.length} classes | ${formatDuration(totalClassMinutes)}`
                    : "No classes scheduled"}
                </p>
              </div>
            </div>
          </div>

          <PlannerWorkspace
            addQuickTaskAction={addQuickTask}
            categories={plannerCategories}
            classBlocks={classBlocks}
            celebrationSound={celebrationSound}
            dayName={dayName}
            deleteTaskAction={deleteTask}
            extendTaskDurationAction={extendTaskDuration}
            isSelectedDateToday={isSelectedDateToday}
            selectedDateLabel={dateLabel}
            tasks={tasks.map((task: PlannerTask) => ({
              id: task.id,
              title: task.title,
              category: task.category,
              status: task.status,
              failureReason: task.failureReason,
              startMinutes: task.startMinutes,
              durationMinutes: task.durationMinutes,
            }))}
            timeSlots={timeSlots.map((slot) => ({
              value: slot,
              label: formatTimeValue(slot),
            }))}
            updateTaskStatusAction={updateTaskStatus}
          />
        </div>
      </section>
    </main>
  );
}
