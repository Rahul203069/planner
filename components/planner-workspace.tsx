"use client";

import * as React from "react";
import {
  Brain,
  BriefcaseBusiness,
  Clock3,
  Filter,
  NotebookPen,
  PlayCircle,
  Plus,
  Timer,
} from "lucide-react";
import { toast } from "sonner";

import { PlannerQuickAddForm } from "@/components/planner-quick-add-form";
import { TaskCompleteCelebration } from "@/components/task-complete-celebration";
import { PlannerTimeline } from "@/components/planner-timeline";
import { TaskActionsDropdown } from "@/components/task-actions-dropdown";
import { Button } from "@/components/ui/button";
import type { CelebrationSoundPreference } from "@/lib/celebration-sound";

type PlannerCategory = {
  value: string;
  label: string;
  description: string;
  icon: "briefcase" | "brain" | "notebook";
  className: string;
};

type PlannerTask = {
  id: string;
  title: string;
  category: "SAAS" | "DSA" | "CLASSWORK";
  status: "OPEN" | "COMPLETED" | "FAILED";
  startMinutes: number;
  durationMinutes: number;
};

type TimelineBlock = {
  id?: string;
  title: string;
  time: string;
  meta: string;
  startMinutes: number;
  durationMinutes: number;
  type: "class" | "task";
  status?: "OPEN" | "COMPLETED" | "FAILED";
};

type OccupiedRange = {
  title: string;
  startMinutes: number;
  durationMinutes: number;
};

type TimelineSlot = {
  value: string;
  label: string;
};

type ActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

type PlannerWorkspaceProps = {
  addQuickTaskAction: (
    previousState: ActionState,
    formData: FormData
  ) => Promise<ActionState>;
  categories: readonly PlannerCategory[];
  classBlocks: TimelineBlock[];
  celebrationSound: CelebrationSoundPreference;
  dayName: string;
  deleteTaskAction: (formData: FormData) => Promise<void>;
  tasks: PlannerTask[];
  timeSlots: TimelineSlot[];
  extendTaskDurationAction: (formData: FormData) => Promise<void>;
  updateTaskStatusAction: (formData: FormData) => Promise<void>;
};

type OptimisticAction =
  | { type: "add"; task: PlannerTask }
  | { type: "delete"; taskId: string }
  | { type: "replace"; tasks: PlannerTask[] }
  | { type: "extend-duration"; taskId: string; minutes: number }
  | { type: "update-status"; taskId: string; status: PlannerTask["status"] };

const taskFilters = ["All", "Open", "Completed", "Failed"];
type TaskFilter = (typeof taskFilters)[number];

function getCategoryIcon(category: PlannerTask["category"]) {
  if (category === "SAAS") {
    return BriefcaseBusiness;
  }

  if (category === "DSA") {
    return Brain;
  }

  return NotebookPen;
}

function getCategoryLabel(category: PlannerTask["category"]) {
  if (category === "SAAS") {
    return "SaaS";
  }

  if (category === "DSA") {
    return "DSA";
  }

  return "Classwork";
}

function formatMinutesToTwelveHour(totalMinutes: number): string {
  const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalizedMinutes / 60);
  const minutes = normalizedMinutes % 60;
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;

  return `${displayHour}:${String(minutes).padStart(2, "0")} ${suffix}`;
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

function formatDurationClock(totalSeconds: number) {
  const normalizedSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(normalizedSeconds / 3600);
  const minutes = Math.floor((normalizedSeconds % 3600) / 60);
  const seconds = normalizedSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
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

function getCurrentSecondsInIndia() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Kolkata",
  }).formatToParts(now);

  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  const second = Number(parts.find((part) => part.type === "second")?.value ?? "0");

  return hour * 3600 + minute * 60 + second;
}

function optimisticReducer(tasks: PlannerTask[], action: OptimisticAction) {
  if (action.type === "replace") {
    return action.tasks;
  }

  if (action.type === "add") {
    return [...tasks, action.task].sort((left, right) => left.startMinutes - right.startMinutes);
  }

  if (action.type === "update-status") {
    return tasks.map((task) =>
      task.id === action.taskId ? { ...task, status: action.status } : task
    );
  }

  if (action.type === "extend-duration") {
    return tasks.map((task) =>
      task.id === action.taskId
        ? { ...task, durationMinutes: task.durationMinutes + action.minutes }
        : task
    );
  }

  return tasks.filter((task) => task.id !== action.taskId);
}

export function PlannerWorkspace({
  addQuickTaskAction,
  categories,
  classBlocks,
  celebrationSound,
  dayName,
  deleteTaskAction,
  extendTaskDurationAction,
  tasks,
  timeSlots,
  updateTaskStatusAction,
}: PlannerWorkspaceProps) {
  const [optimisticTasks, updateOptimisticTasks] = React.useOptimistic(
    tasks,
    optimisticReducer
  );
  const [activeFilter, setActiveFilter] = React.useState<TaskFilter>("All");
  const [celebrationTrigger, setCelebrationTrigger] = React.useState(0);
  const [currentMinutes, setCurrentMinutes] = React.useState(() =>
    getCurrentMinutesInIndia()
  );
  const [currentSeconds, setCurrentSeconds] = React.useState(() =>
    getCurrentSecondsInIndia()
  );

  React.useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentMinutes(getCurrentMinutesInIndia());
      setCurrentSeconds(getCurrentSecondsInIndia());
    }, 1_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const taskBlocks = React.useMemo<TimelineBlock[]>(
    () =>
      optimisticTasks
        .map((task) => ({
          id: task.id,
          title: task.title,
          time: `${formatMinutesToTwelveHour(task.startMinutes)} - ${formatMinutesToTwelveHour(
            task.startMinutes + task.durationMinutes
          )}`,
          meta:
            task.category === "SAAS"
              ? `SaaS task | ${task.status.toLowerCase()}`
              : task.category === "DSA"
                ? `DSA task | ${task.status.toLowerCase()}`
                : `Classwork task | ${task.status.toLowerCase()}`,
          startMinutes: task.startMinutes,
          durationMinutes: task.durationMinutes,
          type: "task",
          status: task.status,
        })),
    [optimisticTasks]
  );

  const visibleTasks = React.useMemo(() => {
    if (activeFilter === "All") {
      return optimisticTasks;
    }

    if (activeFilter === "Open") {
      return optimisticTasks.filter((task) => task.status === "OPEN");
    }

    if (activeFilter === "Completed") {
      return optimisticTasks.filter((task) => task.status === "COMPLETED");
    }

    return optimisticTasks.filter((task) => task.status === "FAILED");
  }, [activeFilter, optimisticTasks]);

  const occupiedRanges = React.useMemo<OccupiedRange[]>(
    () =>
      [...classBlocks, ...taskBlocks.filter((block) => block.status === "OPEN")].map((block) => ({
        title: block.title,
        startMinutes: block.startMinutes,
        durationMinutes: block.durationMinutes,
      })),
    [classBlocks, taskBlocks]
  );

  const activeTask = React.useMemo(
    () =>
      optimisticTasks.find((task) => {
        const endMinutes = task.startMinutes + task.durationMinutes;

        return (
          task.status === "OPEN" &&
          currentMinutes >= task.startMinutes &&
          currentMinutes < endMinutes
        );
      }),
    [currentMinutes, optimisticTasks]
  );

  const nextOpenTask = React.useMemo(
    () =>
      optimisticTasks.find(
        (task) => task.status === "OPEN" && task.startMinutes > currentMinutes
      ),
    [currentMinutes, optimisticTasks]
  );

  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.5fr)]">
      <TaskCompleteCelebration
        soundStyle={celebrationSound}
        trigger={celebrationTrigger}
      />

      <aside className="space-y-5">
        <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Quick Add
              </p>
              <h2 className="mt-2 text-xl font-semibold text-foreground">
                Capture something to do
              </h2>
            </div>
            <div className="rounded-full border border-border/70 bg-background/90 px-3 py-1 text-xs text-muted-foreground">
              Daily flow
            </div>
          </div>

          <PlannerQuickAddForm
            categories={categories}
            occupiedRanges={occupiedRanges}
            addQuickTaskAction={addQuickTaskAction}
            onOptimisticAdd={(task) => {
              updateOptimisticTasks({ type: "add", task });
            }}
          />
        </div>

        <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Today&apos;s Tasks
              </p>
              <h2 className="mt-2 text-xl font-semibold text-foreground">
                One place to manage today
              </h2>
            </div>
            <Button variant="ghost" size="sm">
              <Filter className="size-4" />
              Filters
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {taskFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  activeFilter === filter
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/70 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-3">
            {visibleTasks.length > 0 ? (
              visibleTasks.map((task) => {
                const CategoryIcon = getCategoryIcon(task.category);
                const categoryLabel = getCategoryLabel(task.category);
                const isTaskActive =
                  task.status === "OPEN" &&
                  currentMinutes >= task.startMinutes &&
                  currentMinutes < task.startMinutes + task.durationMinutes;

                return (
                  <div
                    key={task.id}
                    className="rounded-[1.35rem] border border-border/70 bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <CategoryIcon className="size-4" />
                          </span>
                          <p className="text-sm font-semibold text-foreground">
                            {task.title}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {formatMinutesToTwelveHour(task.startMinutes)} -{" "}
                            {formatMinutesToTwelveHour(
                              task.startMinutes + task.durationMinutes
                            )}
                          </span>
                          <span>{formatDuration(task.durationMinutes)}</span>
                          <span>{categoryLabel}</span>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          task.status === "COMPLETED"
                            ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
                            : task.status === "FAILED"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-primary/10 text-primary"
                        }`}
                      >
                        {task.status === "COMPLETED"
                          ? "Completed"
                          : task.status === "FAILED"
                            ? "Failed"
                            : "Open"}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-end gap-2">
                      {isTaskActive ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            updateOptimisticTasks({
                              type: "extend-duration",
                              taskId: task.id,
                              minutes: 10,
                            });

                            const formData = new FormData();
                            formData.set("taskId", task.id);
                            formData.set("minutes", "10");

                            void extendTaskDurationAction(formData).catch(() => {
                              updateOptimisticTasks({
                                type: "extend-duration",
                                taskId: task.id,
                                minutes: -10,
                              });
                              toast.error(`Could not extend "${task.title}".`);
                            });
                          }}
                        >
                          <Plus className="size-4" />
                          10 min
                        </Button>
                      ) : null}
                      <TaskActionsDropdown
                        task={task}
                        deleteTask={deleteTaskAction}
                        onOptimisticDelete={(taskId) => {
                          updateOptimisticTasks({ type: "delete", taskId });
                        }}
                        onOptimisticStatusChange={(taskId, status) => {
                          updateOptimisticTasks({
                            type: "update-status",
                            taskId,
                            status,
                          });
                        }}
                        onTaskCompleted={() => {
                          setCelebrationTrigger((currentValue) => currentValue + 1);
                        }}
                        updateTaskStatus={updateTaskStatusAction}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-[1.35rem] border border-dashed border-border/70 bg-card p-4">
                <div className="flex items-start gap-3">
                  <span className="inline-flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <NotebookPen className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {activeFilter === "All"
                        ? "No tasks added for today"
                        : `No ${activeFilter.toLowerCase()} tasks right now`}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {activeFilter === "All"
                        ? "Use quick add to create your first task for today."
                        : "Try a different filter or update a task status."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="space-y-5">
        <PlannerTimeline
          classBlocks={[...classBlocks, ...taskBlocks]}
          dayName={dayName}
          timeSlots={timeSlots}
        />

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Now Working
            </p>
            <h3 className="mt-2 text-lg font-semibold text-foreground">
              {activeTask ? activeTask.title : "No task is active right now"}
            </h3>

            {activeTask ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-[1.35rem] border border-primary/25 bg-primary/8 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex size-10 items-center justify-center rounded-full bg-primary/12 text-primary">
                        <PlayCircle className="size-5" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {getCategoryLabel(activeTask.category)} task in progress
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatMinutesToTwelveHour(activeTask.startMinutes)} -{" "}
                          {formatMinutesToTwelveHour(
                            activeTask.startMinutes + activeTask.durationMinutes
                          )}
                        </p>
                        <p className="mt-2 font-mono text-lg font-semibold tracking-[0.18em] text-primary">
                          {formatDurationClock(
                            activeTask.startMinutes * 60 +
                              activeTask.durationMinutes * 60 -
                              currentSeconds
                          )}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-primary/12 px-3 py-1 text-xs font-medium text-primary">
                      Live now
                    </span>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-border/70 bg-card px-4 py-4">
                    <Timer className="size-5 text-primary" />
                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Time Left
                    </p>
                    <p className="mt-2 text-base font-semibold text-foreground">
                      {formatDuration(
                        activeTask.startMinutes +
                          activeTask.durationMinutes -
                          currentMinutes
                      )}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-card px-4 py-4">
                    <Clock3 className="size-5 text-primary" />
                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Elapsed
                    </p>
                    <p className="mt-2 text-base font-semibold text-foreground">
                      {formatDuration(currentMinutes - activeTask.startMinutes)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-card px-4 py-4">
                    <Brain className="size-5 text-primary" />
                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Duration
                    </p>
                    <p className="mt-2 text-base font-semibold text-foreground">
                      {formatDuration(activeTask.durationMinutes)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="rounded-[1.35rem] border border-dashed border-border/70 bg-card p-4">
                  <p className="text-sm font-semibold text-foreground">
                    Current time is not inside any open task block.
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {nextOpenTask
                      ? `Next up: "${nextOpenTask.title}" starts at ${formatMinutesToTwelveHour(
                          nextOpenTask.startMinutes
                        )}.`
                      : "No upcoming open tasks for the rest of today."}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/70 bg-card px-4 py-4">
                    <Clock3 className="size-5 text-primary" />
                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Current Time
                    </p>
                    <p className="mt-2 text-base font-semibold text-foreground">
                      {formatMinutesToTwelveHour(currentMinutes)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-card px-4 py-4">
                    <PlayCircle className="size-5 text-primary" />
                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Next Task
                    </p>
                    <p className="mt-2 text-base font-semibold text-foreground">
                      {nextOpenTask ? nextOpenTask.title : "Nothing queued"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Selected Task
            </p>
            <h3 className="mt-2 text-lg font-semibold text-foreground">
              Detail panel preview
            </h3>
            <div className="mt-4 rounded-2xl border border-dashed border-border/70 bg-card px-4 py-4 text-sm text-muted-foreground">
              Select or create a task to inspect its details here.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
