import { redirect } from "next/navigation";
import { Check, Flame, Plus, Repeat2 } from "lucide-react";

import { auth } from "@/auth";
import { toggleHabitCheckInAction } from "@/app/habits/actions";
import { AppSidebar } from "@/components/app-sidebar";
import { HabitCheckInButton } from "@/components/habit-check-in-button";
import { HabitCreateForm } from "@/components/habit-create-form";
import { HabitPresetIcon } from "@/components/habit-preset-icon";
import type { CelebrationSoundPreference } from "@/lib/celebration-sound";
import { cn } from "@/lib/utils";
import {
  computeHabitStreak,
  createDateFromKey,
  formatDateLabel,
  formatFrequencyLabel,
  getHabitPresetByKey,
  getRecentDateKeys,
  getTodayDateKey,
  isHabitScheduledForDate,
} from "@/lib/habits";
import { prisma } from "@/lib/prisma";

export default async function HabitsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin/google?callbackUrl=%2Fhabits");
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
      celebrationSound: true,
      hasCompletedTimetableOnboarding: true,
      timetable: true,
      habits: {
        include: {
          checkIns: {
            orderBy: {
              dateKey: "desc",
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!user) {
    throw new Error("Authenticated user record was not found.");
  }

  if (!user.hasCompletedTimetableOnboarding || !user.timetable) {
    redirect("/app");
  }

  const todayDateKey = getTodayDateKey();
  const recentDateKeys = getRecentDateKeys(todayDateKey, 7);
  const habits = user.habits.map((habit) => {
    const preset = getHabitPresetByKey(habit.presetKey);
    const completedDateKeys = habit.checkIns.map((checkIn) => checkIn.dateKey);
    const completedToday = completedDateKeys.includes(todayDateKey);
    const scheduledToday = isHabitScheduledForDate(
      habit.frequency,
      habit.activeDays,
      todayDateKey
    );
    const streak = computeHabitStreak(
      habit.frequency,
      habit.activeDays,
      completedDateKeys,
      habit.createdAt,
      todayDateKey
    );
    const completedLast7 = recentDateKeys.filter((dateKey) =>
      completedDateKeys.includes(dateKey)
    ).length;

    return {
      ...habit,
      preset,
      completedToday,
      completedLast7,
      scheduledToday,
      streak,
    };
  });

  const totalHabits = habits.length;
  const scheduledTodayCount = habits.filter((habit) => habit.scheduledToday).length;
  const completedTodayCount = habits.filter((habit) => habit.completedToday).length;
  const celebrationSound = user.celebrationSound as CelebrationSoundPreference;

  return (
    <main className="flex min-h-screen w-full flex-col bg-background lg:flex-row">
      <AppSidebar email={user.email} />

      <section className="flex-1 p-6 lg:p-10">
        <div className="rounded-[2rem] border border-border/70 bg-card/85 p-6 shadow-xl shadow-black/5 backdrop-blur lg:p-8">
          <div className="flex flex-col gap-4 border-b border-border/70 pb-6">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                  Habits
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                  Consistency without turning it into a task dump
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Hi {user.name ?? "there"}, keep recurring actions visible and
                  check them off one day at a time.
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-border/70 bg-background/80 px-4 py-3 text-sm text-muted-foreground">
                Today: {formatDateLabel(todayDateKey)}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[1.25rem] border border-border/70 bg-background/80 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Total habits
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {totalHabits}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-border/70 bg-background/80 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Scheduled today
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {scheduledTodayCount}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-border/70 bg-background/80 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Completed today
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {completedTodayCount}
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-border/70 bg-background/80 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Completion rate
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {scheduledTodayCount > 0
                    ? `${Math.round((completedTodayCount / scheduledTodayCount) * 100)}%`
                    : "No habits due"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <Plus className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Add a habit
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Start small. Daily, weekdays, or a custom weekly rhythm.
                  </p>
                </div>
              </div>

              <HabitCreateForm />
            </div>

            <div className="space-y-4">
              {habits.length > 0 ? (
                habits.map((habit) => (
                  <div
                    key={habit.id}
                    className="rounded-[1.5rem] border border-border/70 bg-background/80 p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "rounded-2xl p-3",
                              habit.preset?.iconClassName ?? "bg-primary/10 text-primary"
                            )}
                          >
                            <HabitPresetIcon
                              icon={habit.preset?.icon ?? "book_open"}
                              className="size-5"
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-lg font-semibold text-foreground">
                                {habit.name}
                              </p>
                              {habit.completedToday ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/12 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                                  <Check className="size-3.5" />
                                  Done today
                                </span>
                              ) : habit.scheduledToday ? (
                                <span className="inline-flex items-center rounded-full bg-amber-500/12 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                                  Due today
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                  Rest day
                                </span>
                              )}
                            </div>
                            {habit.preset?.description ? (
                              <p className="mt-1 text-sm text-muted-foreground">
                                {habit.preset.description}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1 rounded-full bg-card px-2.5 py-1">
                            <Repeat2 className="size-3.5" />
                            {formatFrequencyLabel(habit.frequency, habit.activeDays)}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-card px-2.5 py-1">
                            <Flame className="size-3.5" />
                            {habit.streak} day{habit.streak === 1 ? "" : "s"} streak
                          </span>
                          <span className="inline-flex items-center rounded-full bg-card px-2.5 py-1">
                            {habit.completedLast7}/7 checked in recently
                          </span>
                        </div>
                      </div>

                      {habit.scheduledToday ? (
                        <HabitCheckInButton
                          celebrationSound={celebrationSound}
                          dateKey={todayDateKey}
                          habitId={habit.id}
                          isCompletedToday={habit.completedToday}
                          toggleHabitCheckInAction={toggleHabitCheckInAction}
                        />
                      ) : null}
                    </div>

                    <div className="mt-5">
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        Last 7 days
                      </p>
                      <div className="mt-3 grid grid-cols-7 gap-2">
                        {recentDateKeys.map((dateKey) => {
                          const scheduled = isHabitScheduledForDate(
                            habit.frequency,
                            habit.activeDays,
                            dateKey
                          );
                          const completed = habit.checkIns.some(
                            (checkIn) => checkIn.dateKey === dateKey
                          );
                          const dayLabel = new Intl.DateTimeFormat("en-US", {
                            weekday: "short",
                            timeZone: "Asia/Kolkata",
                          }).format(createDateFromKey(dateKey));

                          return (
                            <div
                              key={`${habit.id}-${dateKey}`}
                              className="rounded-xl border border-border/70 bg-card px-2 py-3 text-center"
                            >
                              <p className="text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">
                                {dayLabel}
                              </p>
                              <p className="mt-2 text-xs text-muted-foreground">
                                {dateKey.slice(8)}
                              </p>
                              <div className="mt-3 flex justify-center">
                                <span
                                  className={
                                    completed
                                      ? "inline-flex size-8 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
                                      : scheduled
                                        ? "inline-flex size-8 items-center justify-center rounded-full bg-amber-500/12 text-amber-700 dark:text-amber-300"
                                        : "inline-flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground"
                                  }
                                >
                                  {completed ? "✓" : scheduled ? "•" : "—"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-border/70 bg-background/70 p-6">
                  <p className="text-lg font-semibold text-foreground">
                    No habits yet
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Add your first recurring behavior here instead of mixing it
                    into one-off planner tasks.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
