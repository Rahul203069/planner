export const dayOptions = [
  { value: 0, shortLabel: "Su", longLabel: "Sunday" },
  { value: 1, shortLabel: "Mo", longLabel: "Monday" },
  { value: 2, shortLabel: "Tu", longLabel: "Tuesday" },
  { value: 3, shortLabel: "We", longLabel: "Wednesday" },
  { value: 4, shortLabel: "Th", longLabel: "Thursday" },
  { value: 5, shortLabel: "Fr", longLabel: "Friday" },
  { value: 6, shortLabel: "Sa", longLabel: "Saturday" },
] as const;

export type HabitFrequency = "DAILY" | "WEEKDAYS" | "CUSTOM";

export const habitPresets = [
  {
    key: "no_doom_scrolling_before_bed",
    name: "No doom scrolling before bed",
    description: "Keep nights calmer and sleep cleaner.",
    icon: "moon",
    iconClassName: "bg-indigo-500/12 text-indigo-700 dark:text-indigo-300",
  },
  {
    key: "two_meals_a_day",
    name: "2 meals a day",
    description: "Stay consistent with a simple eating rhythm.",
    icon: "utensils",
    iconClassName: "bg-orange-500/12 text-orange-700 dark:text-orange-300",
  },
  {
    key: "no_sugar",
    name: "No sugar",
    description: "Avoid sugary snacks and drinks for the day.",
    icon: "candy_off",
    iconClassName: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
  },
  {
    key: "drink_water",
    name: "Drink enough water",
    description: "Keep hydration from falling behind your day.",
    icon: "droplets",
    iconClassName: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
  },
  {
    key: "walk_20_minutes",
    name: "Walk 20 minutes",
    description: "Get one clear movement block every day.",
    icon: "footprints",
    iconClassName: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  },
  {
    key: "read_10_pages",
    name: "Read 10 pages",
    description: "Build a low-friction reading habit.",
    icon: "book_open",
    iconClassName: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
  },
] as const;

export type HabitPreset = (typeof habitPresets)[number];
export type HabitPresetKey = HabitPreset["key"];

export function getHabitPresetByKey(key: string | null | undefined) {
  if (!key) {
    return null;
  }

  return habitPresets.find((preset) => preset.key === key) ?? null;
}

export function getTodayDateKey() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());
}

export function createDateFromKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

export function formatDateLabel(dateKey: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(createDateFromKey(dateKey));
}

export function getDateKeyOffset(dateKey: string, offsetDays: number) {
  const date = createDateFromKey(dateKey);
  date.setUTCDate(date.getUTCDate() + offsetDays);

  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Kolkata",
  }).format(date);
}

export function getRecentDateKeys(endDateKey: string, count: number) {
  return Array.from({ length: count }, (_, index) =>
    getDateKeyOffset(endDateKey, -(count - index - 1))
  );
}

export function getWeekdayForDateKey(dateKey: string) {
  return createDateFromKey(dateKey).getUTCDay();
}

export function isHabitScheduledForDate(
  frequency: HabitFrequency,
  activeDays: number[],
  dateKey: string
) {
  const weekday = getWeekdayForDateKey(dateKey);

  if (frequency === "DAILY") {
    return true;
  }

  if (frequency === "WEEKDAYS") {
    return weekday >= 1 && weekday <= 5;
  }

  return activeDays.includes(weekday);
}

export function formatFrequencyLabel(
  frequency: HabitFrequency,
  activeDays: number[]
) {
  if (frequency === "DAILY") {
    return "Daily";
  }

  if (frequency === "WEEKDAYS") {
    return "Weekdays";
  }

  if (activeDays.length === 0) {
    return "Custom";
  }

  const labels = dayOptions
    .filter((day) => activeDays.includes(day.value))
    .map((day) => day.shortLabel);

  return `Custom | ${labels.join(" ")}`;
}

export function computeHabitStreak(
  frequency: HabitFrequency,
  activeDays: number[],
  checkInDateKeys: string[],
  createdAt: Date,
  endDateKey: string
) {
  const completedDays = new Set(checkInDateKeys);
  let streak = 0;

  for (let index = 0; index < 365; index += 1) {
    const dateKey = getDateKeyOffset(endDateKey, -index);
    const currentDate = createDateFromKey(dateKey);

    if (currentDate < createdAt) {
      break;
    }

    if (!isHabitScheduledForDate(frequency, activeDays, dateKey)) {
      continue;
    }

    if (!completedDays.has(dateKey)) {
      break;
    }

    streak += 1;
  }

  return streak;
}
