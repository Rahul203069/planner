"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  dayOptions,
  getHabitPresetByKey,
  habitPresets,
  isHabitScheduledForDate,
  type HabitFrequency,
} from "@/lib/habits";

export type HabitCreateActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors: {
    presetKey?: string[];
    frequency?: string[];
    activeDays?: string[];
  };
};

const createHabitSchema = z
  .object({
    presetKey: z.string().refine(
      (value) => habitPresets.some((preset) => preset.key === value),
      "Choose a habit option."
    ),
    frequency: z.enum(["DAILY", "WEEKDAYS", "CUSTOM"], {
      error: "Choose a valid frequency.",
    }),
    activeDays: z.array(z.number().int().min(0).max(6)),
  })
  .superRefine((value, ctx) => {
    if (value.frequency === "CUSTOM" && value.activeDays.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Pick at least one day for a custom habit.",
        path: ["activeDays"],
      });
    }
  });

async function requireAuthorizedUserId() {
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    throw new Error("Authenticated user record was not found.");
  }

  return user.id;
}

export async function createHabitAction(
  _prevState: HabitCreateActionState,
  formData: FormData
): Promise<HabitCreateActionState> {
  let userId: string;

  try {
    userId = await requireAuthorizedUserId();
  } catch {
    return {
      status: "error",
      message: "You need to sign in again before creating habits.",
      fieldErrors: {},
    };
  }

  const parsed = createHabitSchema.safeParse({
    presetKey: formData.get("presetKey"),
    frequency: formData.get("frequency"),
    activeDays: formData
      .getAll("activeDays")
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Fix the highlighted fields and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const normalizedDays =
    parsed.data.frequency === "DAILY"
      ? dayOptions.map((day) => day.value)
      : parsed.data.frequency === "WEEKDAYS"
        ? [1, 2, 3, 4, 5]
        : [...new Set(parsed.data.activeDays)].sort((left, right) => left - right);
  const preset = getHabitPresetByKey(parsed.data.presetKey);

  if (!preset) {
    return {
      status: "error",
      message: "Choose a habit option.",
      fieldErrors: {
        presetKey: ["Choose a habit option."],
      },
    };
  }

  try {
    const existingHabit = await prisma.habit.findFirst({
      where: {
        userId,
        presetKey: preset.key,
      },
      select: {
        id: true,
      },
    });

    if (existingHabit) {
      return {
        status: "error",
        message: "That habit already exists in your list.",
        fieldErrors: {
          presetKey: ["Pick a different habit option."],
        },
      };
    }

    await prisma.habit.create({
      data: {
        userId,
        presetKey: preset.key,
        name: preset.name,
        frequency: parsed.data.frequency,
        activeDays: normalizedDays,
      },
    });
  } catch {
    return {
      status: "error",
      message: "Habit creation failed. Please try again.",
      fieldErrors: {},
    };
  }

  revalidatePath("/habits");

  return {
    status: "success",
    message: "Habit created.",
    fieldErrors: {},
  };
}

export async function toggleHabitCheckInAction(formData: FormData) {
  const userId = await requireAuthorizedUserId();
  const habitId = formData.get("habitId");
  const dateKey = formData.get("dateKey");
  const intent = formData.get("intent");

  if (
    typeof habitId !== "string" ||
    typeof dateKey !== "string" ||
    typeof intent !== "string" ||
    !["complete", "undo"].includes(intent)
  ) {
    throw new Error("Invalid habit update request.");
  }

  const habit = await prisma.habit.findFirst({
    where: {
      id: habitId,
      userId,
    },
    select: {
      frequency: true,
      activeDays: true,
    },
  });

  if (!habit) {
    throw new Error("Habit not found.");
  }

  if (
    !isHabitScheduledForDate(
      habit.frequency as HabitFrequency,
      habit.activeDays,
      dateKey
    )
  ) {
    throw new Error("That habit is not scheduled for this day.");
  }

  if (intent === "complete") {
    await prisma.habitCheckIn.upsert({
      where: {
        habitId_dateKey: {
          habitId,
          dateKey,
        },
      },
      update: {},
      create: {
        habitId,
        dateKey,
      },
    });
  } else {
    await prisma.habitCheckIn.deleteMany({
      where: {
        habitId,
        dateKey,
      },
    });
  }

  revalidatePath("/habits");
}
