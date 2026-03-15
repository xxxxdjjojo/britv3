export default function PropertyLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      {/* Breadcrumbs skeleton */}
      <div className="mx-auto max-w-7xl px-4 pt-4 pb-2">
        <div className="h-4 w-64 rounded bg-neutral-200" />
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-24 lg:pb-8">
        {/* Hero image placeholder */}
        <div className="mt-2 mb-6 h-64 w-full rounded-xl bg-neutral-200 sm:h-96" />

        {/* Sticky info bar placeholder */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <div className="h-7 w-32 rounded bg-neutral-200" />
              <div className="h-4 w-56 rounded bg-neutral-200" />
              <div className="flex items-center gap-4 mt-2">
                <div className="h-4 w-16 rounded bg-neutral-200" />
                <div className="h-4 w-16 rounded bg-neutral-200" />
                <div className="h-4 w-20 rounded bg-neutral-200" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-20 rounded bg-neutral-200" />
              <div className="h-8 w-20 rounded bg-neutral-200" />
            </div>
          </div>
        </div>

        {/* 65/35 grid */}
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Left column (65%) */}
          <div className="space-y-10 min-w-0">
            {/* Section 1 — About */}
            <div className="space-y-3">
              <div className="h-6 w-40 rounded bg-neutral-200" />
              <div className="h-px w-full rounded bg-neutral-200" />
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-neutral-200" />
                <div className="h-4 w-full rounded bg-neutral-200" />
                <div className="h-4 w-5/6 rounded bg-neutral-200" />
                <div className="h-4 w-4/6 rounded bg-neutral-200" />
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-4 w-40 rounded bg-neutral-200" />
                ))}
              </div>
            </div>

            {/* Section 2 — Property details */}
            <div className="space-y-3">
              <div className="h-6 w-36 rounded bg-neutral-200" />
              <div className="h-px w-full rounded bg-neutral-200" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-16 rounded-xl border bg-neutral-100"
                  />
                ))}
              </div>
            </div>

            {/* Section 3 — Floor plan */}
            <div className="space-y-3">
              <div className="h-6 w-28 rounded bg-neutral-200" />
              <div className="h-px w-full rounded bg-neutral-200" />
              <div className="h-48 w-full rounded-xl bg-neutral-200" />
            </div>
          </div>

          {/* Right column (35%) — sidebar */}
          <aside className="space-y-4">
            {/* Agent card skeleton */}
            <div className="rounded-xl border bg-card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-full bg-neutral-200 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-32 rounded bg-neutral-200" />
                  <div className="h-3 w-24 rounded bg-neutral-200" />
                  <div className="h-3 w-20 rounded bg-neutral-200" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="h-8 rounded bg-neutral-200" />
                <div className="h-8 rounded bg-neutral-200" />
              </div>
              <div className="h-3 w-28 mx-auto rounded bg-neutral-200" />
            </div>

            {/* Booking skeleton */}
            <div className="rounded-xl border bg-card p-5 space-y-4">
              <div className="h-5 w-36 rounded bg-neutral-200" />
              <div className="h-10 w-full rounded bg-neutral-200" />
              <div className="h-10 w-full rounded bg-neutral-200" />
              <div className="h-10 w-full rounded bg-neutral-200" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
