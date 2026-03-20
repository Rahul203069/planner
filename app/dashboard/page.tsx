import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardCharts } from "@/components/dashboard-charts";
import { prisma } from "@/lib/prisma";

type TimetableClass = {
  subject: string;
  start_time: string;
  end_time: string;
};

type TimetableData = {
  days?: Record<string, TimetableClass[]>;
};

type TaskCategoryValue = "SAAS" | "DSA" | "CLASSWORK";
type TaskStatusValue = "OPEN" | "COMPLETED" | "FAILED";

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

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function formatHours(minutes: number) {
  const hours = minutes / 60;
  return `${hours.toFixed(1)}h`;
}

function formatMinutesToTwelveHour(totalMinutes: number) {
  const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalizedMinutes / 60);
  const minutes = normalizedMinutes % 60;
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;

  return `${displayHour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function getDateParts(date: Date) {
  const dateKey = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Kolkata",
  }).format(date);
  const shortDay = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);
  const fullDay = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: "Asia/Kolkata",
  }).format(date);

  return { dateKey, fullDay, shortDay };
}

function getCurrentDateTimeInIndia() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Kolkata",
  }).formatToParts(now);

  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  const { dateKey } = getDateParts(now);

  return {
    dateKey,
    currentMinutes: hour * 60 + minute,
  };
}

function buildRecentDays(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (count - index - 1));
    return getDateParts(date);
  });
}

function getAvailableFreeMinutesForDay(
  timetable: TimetableData,
  dayName: string
) {
  const entries = timetable.days?.[dayName] ?? [];
  const classMinutes = entries.reduce((total, entry) => {
    const startMinutes = parseTimeToMinutes(entry.start_time);
    const endMinutes = parseTimeToMinutes(entry.end_time);

    if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
      return total;
    }

    return total + (endMinutes - startMinutes);
  }, 0);
  const bufferMinutes = entries.length * 60;
  const totalDayMinutes = 24 * 60;
  const sleepMinutes = 8 * 60;

  return Math.max(0, totalDayMinutes - sleepMinutes - classMinutes - bufferMinutes);
}

function computeCurrentStreak(dateKeysWithTasks: string[]) {
  const keySet = new Set(dateKeysWithTasks);
  let streak = 0;

  for (let index = 0; index < 365; index += 1) {
    const date = new Date();
    date.setDate(date.getDate() - index);
    const { dateKey } = getDateParts(date);

    if (!keySet.has(dateKey)) {
      break;
    }

    streak += 1;
  }

  return streak;
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin/google?callbackUrl=%2Fdashboard");
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
      hasCompletedTimetableOnboarding: true,
      timetable: true,
    },
  });

  if (!user) {
    throw new Error("Authenticated user record was not found.");
  }

  if (!user.hasCompletedTimetableOnboarding || !user.timetable) {
    redirect("/app");
  }

  const tasks = await prisma.task.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      scheduledDate: "asc",
    },
  });

  const timetable = user.timetable as TimetableData;
  const { dateKey: todayDateKey, currentMinutes } = getCurrentDateTimeInIndia();
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(
    (task) => task.status === ("COMPLETED" as TaskStatusValue)
  );
  const failedTasks = tasks.filter(
    (task) => task.status === ("FAILED" as TaskStatusValue)
  );
  const openTasks = tasks.filter((task) => task.status === ("OPEN" as TaskStatusValue));
  const successRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;
  const streak = computeCurrentStreak([...new Set(tasks.map((task) => task.scheduledDate))]);

  const recentDays = buildRecentDays(7);
  const recentTaskMap = new Map(
    recentDays.map((day) => [
      day.dateKey,
      tasks.filter((task) => task.scheduledDate === day.dateKey),
    ])
  );

  const dailyTaskOutcome = recentDays.map((day) => {
    const dailyTasks = recentTaskMap.get(day.dateKey) ?? [];

    return {
      day: day.shortDay,
      completed: dailyTasks.filter(
        (task) => task.status === ("COMPLETED" as TaskStatusValue)
      ).length,
      failed: dailyTasks.filter(
        (task) => task.status === ("FAILED" as TaskStatusValue)
      ).length,
    };
  });

  const recentFreeMinutes = recentDays.reduce((total, day) => {
    const freeMinutes = getAvailableFreeMinutesForDay(timetable, day.fullDay);
    return total + freeMinutes;
  }, 0);
  const recentTaskMinutes = recentDays.reduce((total, day) => {
    const dailyTasks = recentTaskMap.get(day.dateKey) ?? [];
    return total + dailyTasks.reduce((sum, task) => sum + task.durationMinutes, 0);
  }, 0);
  const usedFreeTimePercentage =
    recentFreeMinutes > 0 ? (recentTaskMinutes / recentFreeMinutes) * 100 : 0;

  const energySplitSource = [
    {
      name: "SaaS",
      key: "saas",
      minutes: tasks
        .filter((task) => task.category === ("SAAS" as TaskCategoryValue))
        .reduce((sum, task) => sum + task.durationMinutes, 0),
    },
    {
      name: "DSA",
      key: "dsa",
      minutes: tasks
        .filter((task) => task.category === ("DSA" as TaskCategoryValue))
        .reduce((sum, task) => sum + task.durationMinutes, 0),
    },
    {
      name: "Classwork",
      key: "classwork",
      minutes: tasks
        .filter((task) => task.category === ("CLASSWORK" as TaskCategoryValue))
        .reduce((sum, task) => sum + task.durationMinutes, 0),
    },
  ];
  const totalTrackedMinutes = energySplitSource.reduce(
    (sum, item) => sum + item.minutes,
    0
  );
  const energySplit = energySplitSource.map((item) => ({
    name: item.name,
    value:
      totalTrackedMinutes > 0
        ? Number(((item.minutes / totalTrackedMinutes) * 100).toFixed(1))
        : 0,
    fill: `var(--color-${item.key})`,
  }));

  const activeDayKeys = [...new Set(tasks.map((task) => task.scheduledDate))];
  const activeDaysCount = activeDayKeys.length || 1;
  const avgDailyWorkMinutes = Math.round(
    tasks.reduce((sum, task) => sum + task.durationMinutes, 0) / activeDaysCount
  );
  const avgCategoryHours = [
    {
      category: "SaaS",
      actual: Number(
        (
          tasks
            .filter((task) => task.category === ("SAAS" as TaskCategoryValue))
            .reduce((sum, task) => sum + task.durationMinutes, 0) /
          activeDaysCount /
          60
        ).toFixed(2)
      ),
      target: 2.5,
    },
    {
      category: "DSA",
      actual: Number(
        (
          tasks
            .filter((task) => task.category === ("DSA" as TaskCategoryValue))
            .reduce((sum, task) => sum + task.durationMinutes, 0) /
          activeDaysCount /
          60
        ).toFixed(2)
      ),
      target: 1.5,
    },
    {
      category: "Classwork",
      actual: Number(
        (
          tasks
            .filter((task) => task.category === ("CLASSWORK" as TaskCategoryValue))
            .reduce((sum, task) => sum + task.durationMinutes, 0) /
          activeDaysCount /
          60
        ).toFixed(2)
      ),
      target: 2,
    },
  ];

  const dashboardMetrics = [
    {
      label: "Day Streak",
      value: `${streak} day${streak === 1 ? "" : "s"}`,
      note: "Consecutive days with at least one task added",
    },
    {
      label: "Avg Daily Success Rate",
      value: formatPercent(successRate),
      note: `${completedTasks.length} completed out of ${totalTasks} total tasks`,
    },
    {
      label: "Tasks Completed",
      value: String(completedTasks.length),
      note: `${openTasks.length} still open in the planner`,
    },
    {
      label: "Tasks Failed",
      value: String(failedTasks.length),
      note: "Tasks marked failed across your tracked days",
    },
    {
      label: "Used Free Time",
      value: formatPercent(usedFreeTimePercentage),
      note: "Task hours used against free time from your timetable",
    },
    {
      label: "Avg Daily Work Hours",
      value: formatHours(avgDailyWorkMinutes),
      note: "Average scheduled task time across active task days",
    },
  ];

  const currentTasks = tasks
    .filter((task) => {
      if (task.status !== ("OPEN" as TaskStatusValue) || task.scheduledDate !== todayDateKey) {
        return false;
      }

      const endMinutes = task.startMinutes + task.durationMinutes;
      return task.startMinutes <= currentMinutes && endMinutes > currentMinutes;
    })
    .slice(0, 5);

  const upcomingTasks = tasks
    .filter((task) => {
      if (task.status !== ("OPEN" as TaskStatusValue)) {
        return false;
      }

      if (task.scheduledDate > todayDateKey) {
        return true;
      }

      return (
        task.scheduledDate === todayDateKey && task.startMinutes > currentMinutes
      );
    })
    .sort((left, right) => {
      if (left.scheduledDate === right.scheduledDate) {
        return left.startMinutes - right.startMinutes;
      }

      return left.scheduledDate.localeCompare(right.scheduledDate);
    })
    .slice(0, 5);

  const recentCompletedTasks = [...completedTasks]
    .sort((left, right) => {
      if (left.scheduledDate === right.scheduledDate) {
        return right.startMinutes - left.startMinutes;
      }

      return right.scheduledDate.localeCompare(left.scheduledDate);
    })
    .slice(0, 5);

  const taskCollections = [
    {
      title: "Current Tasks",
      description: "Open tasks that should be happening right now.",
      items: currentTasks,
      empty: "No task is active right now.",
    },
    {
      title: "Upcoming Tasks",
      description: "Next open tasks queued in your planner.",
      items: upcomingTasks,
      empty: "No upcoming open tasks scheduled.",
    },
    {
      title: "Completed Tasks",
      description: "Most recently completed work blocks.",
      items: recentCompletedTasks,
      empty: "No completed tasks yet.",
    },
  ];

  return (
    <main className="flex min-h-screen w-full flex-col bg-background lg:flex-row">
      <AppSidebar email={user.email} />

      <section className="flex-1 p-6 lg:p-10">
        <div className="rounded-[2rem] border border-border/70 bg-card/85 p-6 shadow-xl shadow-black/5 backdrop-blur lg:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                Overview
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                Weekly planner dashboard
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Hi {user.name ?? "there"}, welcome back.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Group: {user.selectedGroup ?? "Not set"}
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {dashboardMetrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-[1.5rem] border border-border/70 bg-background/80 p-5"
              >
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  {metric.label}
                </p>
                <p className="mt-3 text-3xl font-semibold text-foreground">
                  {metric.value}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {metric.note}
                </p>
              </div>
            ))}
          </div>
          <DashboardCharts
            avgCategoryHours={avgCategoryHours}
            dailyTaskOutcome={dailyTaskOutcome}
            energySplit={energySplit}
          />

          <div className="mt-6 grid gap-6 xl:grid-cols-3">
            {taskCollections.map((collection) => (
              <div
                key={collection.title}
                className="rounded-[1.5rem] border border-border/70 bg-background/80 p-5"
              >
                <p className="text-sm font-semibold text-foreground">
                  {collection.title}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {collection.description}
                </p>

                <div className="mt-5 space-y-3">
                  {collection.items.length > 0 ? (
                    collection.items.map((task) => (
                      <div
                        key={`${collection.title}-${task.id}`}
                        className="rounded-2xl border border-border/70 bg-card px-4 py-3"
                      >
                        <p className="text-sm font-semibold text-foreground">
                          {task.title}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{task.category}</span>
                          <span>{task.scheduledDate}</span>
                          <span>
                            {formatMinutesToTwelveHour(task.startMinutes)} -{" "}
                            {formatMinutesToTwelveHour(
                              task.startMinutes + task.durationMinutes
                            )}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border/70 bg-card px-4 py-4 text-sm text-muted-foreground">
                      {collection.empty}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
