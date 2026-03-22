function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-gradient-to-r from-muted via-muted/60 to-muted ${className}`}
    />
  );
}

export default function PlannerLoading() {
  return (
    <main className="flex min-h-screen w-full flex-col bg-background lg:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-b border-border/70 bg-card/95 px-4 py-5 backdrop-blur lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
        <div className="space-y-3 px-2">
          <SkeletonBlock className="h-4 w-28 rounded-full" />
          <SkeletonBlock className="h-3 w-40 rounded-full" />
        </div>

        <div className="mt-6 grid gap-2">
          <SkeletonBlock className="h-11 w-full" />
          <SkeletonBlock className="h-11 w-full" />
          <SkeletonBlock className="h-11 w-full" />
          <SkeletonBlock className="h-11 w-full" />
        </div>

        <div className="mt-auto space-y-3 border-t border-border/70 pt-4">
          <SkeletonBlock className="h-9 w-full" />
          <SkeletonBlock className="h-8 w-full" />
        </div>
      </aside>

      <section className="flex-1 p-6 lg:p-10">
        <div className="rounded-[2rem] border border-border/70 bg-card/85 p-6 shadow-xl shadow-black/5 backdrop-blur lg:p-8">
          <div className="flex flex-col gap-4 border-b border-border/70 pb-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="space-y-3">
                <SkeletonBlock className="h-3 w-20 rounded-full" />
                <SkeletonBlock className="h-8 w-64" />
                <SkeletonBlock className="h-4 w-80 max-w-full rounded-full" />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <SkeletonBlock className="h-8 w-28 rounded-full" />
                <SkeletonBlock className="h-8 w-24 rounded-full" />
                <SkeletonBlock className="h-8 w-24 rounded-full" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SkeletonBlock className="h-20 w-full" />
              <SkeletonBlock className="h-20 w-full" />
              <SkeletonBlock className="h-20 w-full" />
              <SkeletonBlock className="h-20 w-full" />
            </div>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.5fr)]">
            <aside className="space-y-5">
              <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-5">
                <SkeletonBlock className="h-6 w-40 rounded-full" />
                <div className="mt-5 space-y-4">
                  <SkeletonBlock className="h-14 w-full" />
                  <SkeletonBlock className="h-24 w-full" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SkeletonBlock className="h-14 w-full" />
                    <SkeletonBlock className="h-14 w-full" />
                  </div>
                  <SkeletonBlock className="h-10 w-28 rounded-full" />
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-5">
                <div className="flex items-center justify-between gap-3">
                  <SkeletonBlock className="h-6 w-44 rounded-full" />
                  <SkeletonBlock className="h-8 w-20 rounded-full" />
                </div>
                <div className="mt-4 flex gap-2">
                  <SkeletonBlock className="h-7 w-14 rounded-full" />
                  <SkeletonBlock className="h-7 w-16 rounded-full" />
                  <SkeletonBlock className="h-7 w-22 rounded-full" />
                </div>
                <div className="mt-5 space-y-3">
                  <SkeletonBlock className="h-28 w-full" />
                  <SkeletonBlock className="h-28 w-full" />
                </div>
              </div>
            </aside>

            <div className="space-y-5">
              <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-3">
                    <SkeletonBlock className="h-3 w-24 rounded-full" />
                    <SkeletonBlock className="h-6 w-52 rounded-full" />
                  </div>
                  <SkeletonBlock className="h-8 w-40 rounded-full" />
                </div>
                <div className="mt-5 rounded-[1.5rem] border border-border/70 bg-card p-3">
                  <div className="space-y-3">
                    {Array.from({ length: 7 }).map((_, index) => (
                      <SkeletonBlock
                        key={index}
                        className="h-16 w-full rounded-xl"
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <SkeletonBlock className="h-72 w-full" />
                <SkeletonBlock className="h-72 w-full" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
