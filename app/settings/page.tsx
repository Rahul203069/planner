import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ArrowRight, Table2 } from "lucide-react";

import { auth } from "@/auth";
import { AppSidebar } from "@/components/app-sidebar";
import { CelebrationSoundSettings } from "@/components/celebration-sound-settings";
import { PlannerToastListener } from "@/components/planner-toast-listener";
import { ThemePalettePicker } from "@/components/theme-palette-picker";
import {
  isCelebrationSoundPreference,
} from "@/lib/celebration-sound";
import { prisma } from "@/lib/prisma";

type SettingsPageProps = {
  searchParams?: Promise<{
    status?: string;
    message?: string;
  }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin/google?callbackUrl=%2Fsettings");
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
      celebrationSound: true,
    },
  });

  if (!user) {
    throw new Error("Authenticated user record was not found.");
  }

  if (!user.hasCompletedTimetableOnboarding || !user.timetable) {
    redirect("/app");
  }

  const userId = user.id;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const status =
    resolvedSearchParams?.status === "error"
      ? "error"
      : resolvedSearchParams?.status === "success"
        ? "success"
        : null;
  const message = resolvedSearchParams?.message;

  async function updateCelebrationSound(formData: FormData) {
    "use server";

    const nextCelebrationSound = formData.get("celebrationSound");

    if (
      typeof nextCelebrationSound !== "string" ||
      !isCelebrationSoundPreference(nextCelebrationSound)
    ) {
      redirect(
        "/settings?status=error&message=Could%20not%20update%20celebration%20sound."
      );
    }

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        celebrationSound: nextCelebrationSound,
      },
    });

    revalidatePath("/settings");
    revalidatePath("/planner");

    redirect(
      "/settings?status=success&message=Celebration%20sound%20updated."
    );
  }

  return (
    <main className="flex min-h-screen w-full flex-col bg-background lg:flex-row">
      <AppSidebar email={user.email} />

      <section className="flex-1 p-6 lg:p-10">
        <div className="rounded-[2rem] border border-border/70 bg-card/85 p-6 shadow-xl shadow-black/5 backdrop-blur lg:p-8">
          <PlannerToastListener status={status} message={message} />

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
              Settings
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              Account settings
            </h1>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Name
              </p>
              <p className="mt-3 text-lg font-semibold text-foreground">
                {user.name ?? "Not set"}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Group
              </p>
              <p className="mt-3 text-lg font-semibold text-foreground">
                {user.selectedGroup ?? "Not set"}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-border/70 bg-background/80 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Celebration sound
            </p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">
              Choose the task completion vibe
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              This is saved to your account and used whenever you mark a planner
              task as completed.
            </p>

            <CelebrationSoundSettings
              currentSound={user.celebrationSound}
              updateCelebrationSound={updateCelebrationSound}
            />
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-border/70 bg-background/80 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Color palette
            </p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">
              Change the app accent colors
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Pick a palette for the planner UI. This updates instantly and stays
              saved in your browser.
            </p>
            <div className="mt-5">
              <ThemePalettePicker />
            </div>
          </div>

          <Link
            href="/table-view"
            className="mt-6 block rounded-[1.5rem] border border-border/70 bg-background/80 p-5 transition-colors hover:bg-background"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <Table2 className="size-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    Timetable
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-foreground">
                    View your timetable
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Open the parsed weekly timetable and review your class schedule.
                  </p>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                <span>Open timetable</span>
                <ArrowRight className="size-4" />
              </div>
            </div>
          </Link>

          <div className="mt-6 rounded-[1.5rem] border border-dashed border-border/70 bg-background/70 p-5">
            <p className="text-sm font-semibold text-foreground">More settings later</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              This page is ready for future profile edits, timetable updates,
              notification preferences, and planner defaults.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
