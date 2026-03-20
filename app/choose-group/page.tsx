import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import {
  filterTimetableByGroup,
  isSupportedGroup,
  type SupportedGroup,
} from "@/lib/timetable-filter";
import { prisma } from "@/lib/prisma";

const groups: SupportedGroup[] = ["G1", "G2", "G3", "G4"];

type TimetableClass = {
  subject: string;
  start_time: string;
  end_time: string;
  uncertain: boolean | null;
  note: string | null;
};

type TimetableData = {
  days: Record<string, TimetableClass[]>;
  meta: {
    lunch_break: {
      start_time: string;
      end_time: string;
    } | null;
    parser_rules_applied: string[];
  };
};

export default async function ChooseGroupPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin/google?callbackUrl=%2Fchoose-group");
  }

  if (!session.user.email) {
    throw new Error("Authenticated user is missing an email address.");
  }

  const userEmail = session.user.email;

  const user = await prisma.user.findUnique({
    where: {
      email: userEmail,
    },
    select: {
      email: true,
      rawTimetable: true,
      selectedGroup: true,
      hasCompletedTimetableOnboarding: true,
    },
  });

  if (!user) {
    throw new Error("Authenticated user record was not found.");
  }

  if (!user.rawTimetable) {
    redirect("/app");
  }

  if (user.hasCompletedTimetableOnboarding && user.selectedGroup) {
    redirect("/table-view");
  }

  async function saveGroupSelection(formData: FormData) {
    "use server";

    const group = formData.get("group");

    if (typeof group !== "string" || !isSupportedGroup(group)) {
      throw new Error("Please select a valid group.");
    }

    const latestUser = await prisma.user.findUnique({
      where: {
        email: userEmail,
      },
      select: {
        rawTimetable: true,
      },
    });

    if (!latestUser?.rawTimetable) {
      throw new Error("Raw timetable data was not found.");
    }

    const rawTimetable = latestUser.rawTimetable as TimetableData;
    const filteredTimetable = filterTimetableByGroup(rawTimetable, group);

    await prisma.user.update({
      where: {
        email: userEmail,
      },
      data: {
        selectedGroup: group,
        timetable: filteredTimetable as Prisma.InputJsonValue,
        hasCompletedTimetableOnboarding: true,
      },
    });

    revalidatePath("/app");
    revalidatePath("/choose-group");
    revalidatePath("/table-view");
    redirect("/table-view");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-8 lg:px-10">
      <header className="flex items-center justify-between py-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground">
            PlannerPro
          </p>
          <p className="text-xs text-muted-foreground">
            Choose your group for {user.email}
          </p>
        </div>
        <Link href="/api/auth/signout?callbackUrl=%2F">
          <Button variant="outline" size="sm">
            Sign Out
          </Button>
        </Link>
      </header>

      <section className="flex flex-1 items-center justify-center py-10">
        <div className="w-full max-w-3xl rounded-[2rem] border border-border/70 bg-card/85 p-8 shadow-xl shadow-black/5 backdrop-blur">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Final Setup Step
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Select your group
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            We have your full timetable JSON. Choose your group now, and we will
            remove class entries labeled for the other groups before showing your
            final timetable view.
          </p>

          <form action={saveGroupSelection} className="mt-8 space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {groups.map((group) => (
                <label
                  key={group}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border/70 bg-background/80 px-4 py-4 text-sm font-medium text-foreground"
                >
                  <input type="radio" name="group" value={group} required />
                  <span>{group}</span>
                </label>
              ))}
            </div>

            <Button size="lg" type="submit">
              Save group and continue
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
