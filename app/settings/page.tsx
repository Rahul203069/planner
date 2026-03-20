//@ts-nocheck
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemePalettePicker } from "@/components/theme-palette-picker";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
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

  return (
    <main className="flex min-h-screen w-full flex-col bg-background lg:flex-row">
      <AppSidebar email={user.email} />

      <section className="flex-1 p-6 lg:p-10">
        <div className="rounded-[2rem] border border-border/70 bg-card/85 p-6 shadow-xl shadow-black/5 backdrop-blur lg:p-8">
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
            Color palette
          </p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">
            Change the app accent colors
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Pick a palette for the planner UI. This updates instantly and stays saved
            in your browser.
          </p>
          <div className="mt-5">
            <ThemePalettePicker />
          </div>
        </div>

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
