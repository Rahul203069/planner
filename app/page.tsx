import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";

import { auth } from "@/auth";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { ThemeControls } from "@/components/theme-controls";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const session = await auth();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-6 lg:px-10 lg:py-8">
      <header className="flex items-center justify-between py-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground">
            PlannerPro
          </p>
          <p className="text-xs text-muted-foreground">
            {session?.user?.email ?? "For student SaaS builders"}
          </p>
        </div>
        {session ? (
          <Link href="/app">
            <Button size="sm">Open App</Button>
          </Link>
        ) : (
          <GoogleSignInButton size="sm">Continue with Google</GoogleSignInButton>
        )}
      </header>

      <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
            <Sparkles className="size-3.5" />
            College and SaaS in one planner
          </div>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              A minimal planner for managing study work and startup momentum.
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Keep classes, assignments, shipping, and growth tasks in one calm
              workspace built for student founders.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            {session ? (
              <Link href="/app">
                <Button
                  size="lg"
                  className="h-13 rounded-2xl px-6 text-base font-semibold shadow-lg shadow-primary/25"
                >
                  Open App
                  <ArrowUpRight className="size-4" />
                </Button>
              </Link>
            ) : (
              <GoogleSignInButton
                size="lg"
                className="h-13 rounded-2xl px-6 text-base font-semibold shadow-lg shadow-primary/25"
              >
                Continue with Google
                <ArrowUpRight className="size-4" />
              </GoogleSignInButton>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-5 rounded-[2rem] border border-border/70 bg-card/80 p-6 shadow-xl shadow-black/5 backdrop-blur lg:p-7">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">
              Simple by design
            </p>
            <p className="text-sm leading-7 text-muted-foreground">
              PlannerPro helps you see what matters this week without drowning
              you in dashboards, widgets, and noise.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-border/70 bg-background/85 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
              What it does
            </p>
            <div className="mt-3 space-y-2 text-sm leading-6 text-foreground">
              <p>Track college deadlines.</p>
              <p>Plan SaaS work blocks.</p>
              <p>Stay consistent without overload.</p>
            </div>
          </div>
          <ThemeControls />
        </div>
      </section>
    </main>
  );
}
