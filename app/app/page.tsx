import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { TimetableUploadSubmitButton } from "@/components/timetable-upload-submit-button";
import { parseTimetableImage } from "@/lib/timetable-parser";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";

export default async function AppEntryPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin/google?callbackUrl=%2Fapp");
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
      name: true,
      email: true,
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
  const hasCompletedTimetableOnboarding = user.hasCompletedTimetableOnboarding;

  async function handleTimetableUpload(formData: FormData) {
    "use server";

    const image = formData.get("timetableImage");

    if (!(image instanceof File) || image.size === 0) {
      throw new Error("Please upload a timetable image.");
    }

    const parsedTimetable = await parseTimetableImage(image);

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        hasCompletedTimetableOnboarding: false,
        selectedGroup: null,
        rawTimetable: JSON.parse(JSON.stringify(parsedTimetable)),
        timetable: null,
        timetableUploadedAt: new Date(),
      } as never,
    });

    revalidatePath("/app");
    revalidatePath("/choose-group");
    revalidatePath("/table-view");
    redirect("/choose-group");
  }

  if (!hasCompletedTimetableOnboarding && !userTimetable) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-8 lg:px-10">
        <header className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground">
              PlannerPro
            </p>
            <p className="text-xs text-muted-foreground">
              Timetable setup for {userEmail}
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
              First Login Setup
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Upload your timetable image
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              We will parse the timetable with GPT, convert it into structured JSON,
              and save it to your account. This step only appears until your first
              timetable is successfully stored.
            </p>

            <form action={handleTimetableUpload} className="mt-8 space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="timetableImage"
                  className="text-sm font-medium text-foreground"
                >
                  Timetable Image
                </label>
                <input
                  id="timetableImage"
                  name="timetableImage"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  required
                  className="block w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground file:mr-4 file:rounded-xl file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
                />
              </div>

              <TimetableUploadSubmitButton />
            </form>
          </div>
        </section>
      </main>
    );
  }

  if (!hasCompletedTimetableOnboarding) {
    redirect("/choose-group");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl rounded-[2rem] border border-border/70 bg-card/85 p-8 text-center shadow-xl shadow-black/5 backdrop-blur">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
          PlannerPro App
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Welcome back{userName ? `, ${userName}` : ""}.
        </h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          You are signed in with Google as {userEmail}.
        </p>
        <pre className="mt-6 overflow-x-auto rounded-2xl border border-border/70 bg-background/80 p-4 text-left text-xs leading-6 text-foreground">
          {JSON.stringify(userTimetable, null, 2)}
        </pre>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/table-view">
            <Button size="lg">View Timetable</Button>
          </Link>
          <Link href="/">
            <Button variant="outline" size="lg">
              Back Home
            </Button>
          </Link>
          <Link href="/api/auth/signout?callbackUrl=%2F">
            <Button size="lg">
              Sign Out
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
