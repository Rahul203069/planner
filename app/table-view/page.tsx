import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AppSidebar } from "@/components/app-sidebar";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

export default async function TableViewPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin/google?callbackUrl=%2Ftable-view");
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
      timetable: true,
      hasCompletedTimetableOnboarding: true,
      selectedGroup: true,
    },
  });

  if (!user) {
    throw new Error("Authenticated user record was not found.");
  }

  if (!user.hasCompletedTimetableOnboarding || !user.timetable) {
    redirect("/app");
  }

  const timetable = user.timetable as TimetableData;
  const days = Object.entries(timetable.days ?? {});

  async function deleteUncertainEntry(formData: FormData) {
    "use server";

    const day = formData.get("day");
    const indexValue = formData.get("index");

    if (typeof day !== "string" || typeof indexValue !== "string") {
      throw new Error("Invalid timetable delete request.");
    }

    const rowIndex = Number(indexValue);

    if (!Number.isInteger(rowIndex) || rowIndex < 0) {
      throw new Error("Invalid timetable row index.");
    }

    const latestUser = await prisma.user.findUnique({
      where: {
        email: userEmail,
      },
      select: {
        timetable: true,
      },
    });

    if (!latestUser?.timetable) {
      throw new Error("No timetable found for this user.");
    }

    const latestTimetable = latestUser.timetable as TimetableData;
    const dayEntries = latestTimetable.days?.[day];

    if (!Array.isArray(dayEntries) || !dayEntries[rowIndex]?.uncertain) {
      throw new Error("Only uncertain timetable rows can be deleted.");
    }

    const updatedTimetable: TimetableData = {
      ...latestTimetable,
      days: {
        ...latestTimetable.days,
        [day]: dayEntries.filter((_, index) => index !== rowIndex),
      },
    };

    await prisma.user.update({
      where: {
        email: userEmail,
      },
      data: {
        timetable: JSON.parse(JSON.stringify(updatedTimetable)),
      },
    });

    revalidatePath("/table-view");
  }

  return (
    <main className="flex min-h-screen w-full flex-col bg-background lg:flex-row">
      <AppSidebar email={user.email} />

      <section className="flex-1 p-6 lg:p-10">
        <div className="rounded-[2rem] border border-border/70 bg-card/85 p-6 shadow-xl shadow-black/5 backdrop-blur lg:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                Weekly Schedule
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                Parsed timetable view
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                AI-generated timetable for {user.email}
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Group: {user.selectedGroup ?? "Not selected"}</p>
              {timetable.meta?.lunch_break ? (
                <p>
                  Lunch: {timetable.meta.lunch_break.start_time} -{" "}
                  {timetable.meta.lunch_break.end_time}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-6 space-y-6">
            {days.map(([day, classes]) => (
              <div
                key={day}
                className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-background/80"
              >
                <div className="border-b border-border/70 px-5 py-4">
                  <h2 className="text-lg font-semibold text-foreground">{day}</h2>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Subject</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>End</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classes.length > 0 ? (
                      classes.map((entry, index) => (
                        <TableRow key={`${day}-${index}`}>
                          <TableCell className="font-medium text-foreground">
                            {entry.subject}
                          </TableCell>
                          <TableCell>{entry.start_time}</TableCell>
                          <TableCell>{entry.end_time}</TableCell>
                          <TableCell>
                            {entry.uncertain ? "Uncertain" : "Confirmed"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {entry.note ?? "-"}
                          </TableCell>
                          <TableCell>
                            {entry.uncertain ? (
                              <form action={deleteUncertainEntry}>
                                <input type="hidden" name="day" value={day} />
                                <input
                                  type="hidden"
                                  name="index"
                                  value={String(index)}
                                />
                                <Button size="sm" variant="destructive" type="submit">
                                  Delete
                                </Button>
                              </form>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-muted-foreground">
                          No classes for this day.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-end gap-3">
            <Link href="/dashboard">
              <Button size="sm">Continue</Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
