import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/admin";
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

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin/google?callbackUrl=%2Fadmin");
  }

  if (!session.user.email) {
    throw new Error("Authenticated user is missing an email address.");
  }

  if (!isAdminEmail(session.user.email)) {
    redirect("/");
  }

  const adminEmail = session.user.email;

  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      email: true,
      hasCompletedTimetableOnboarding: true,
      selectedGroup: true,
      createdAt: true,
    },
  });

  async function deleteUserAction(formData: FormData) {
    "use server";

    const currentSession = await auth();

    if (!currentSession?.user?.email || !isAdminEmail(currentSession.user.email)) {
      throw new Error("Unauthorized admin action.");
    }

    const userId = formData.get("userId");

    if (typeof userId !== "string" || !userId) {
      throw new Error("Invalid user delete request.");
    }

    const targetUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (!targetUser) {
      throw new Error("User not found.");
    }

    if (targetUser.email === currentSession.user.email) {
      throw new Error("You cannot delete your own admin account.");
    }

    await prisma.user.delete({
      where: {
        id: userId,
      },
    });

    revalidatePath("/admin");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 lg:px-10">
      <header className="flex items-center justify-between py-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground">
            PlannerPro Admin
          </p>
          <p className="text-xs text-muted-foreground">
            Signed in as {adminEmail}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="outline" size="sm">
              Back Home
            </Button>
          </Link>
          <Link href="/api/auth/signout?callbackUrl=%2F">
            <Button size="sm">Sign Out</Button>
          </Link>
        </div>
      </header>

      <section className="py-8">
        <div className="rounded-[2rem] border border-border/70 bg-card/85 p-6 shadow-xl shadow-black/5 backdrop-blur lg:p-8">
          <div className="mb-6">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
              User Management
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              All users
            </h1>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Onboarding</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium text-foreground">
                    {user.name ?? "-"}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.selectedGroup ?? "-"}</TableCell>
                  <TableCell>
                    {user.hasCompletedTimetableOnboarding ? "Complete" : "Pending"}
                  </TableCell>
                  <TableCell>
                    {new Intl.DateTimeFormat("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(user.createdAt)}
                  </TableCell>
                  <TableCell>
                    <form action={deleteUserAction}>
                      <input type="hidden" name="userId" value={user.id} />
                      <Button
                        size="sm"
                        variant="destructive"
                        type="submit"
                        disabled={user.email === adminEmail}
                      >
                        Delete
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </main>
  );
}
