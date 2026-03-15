export default function PropertyDetailLoading() {
  return (
    <div
      className="min-h-screen bg-neutral-50"
      role="status"
      aria-label="Loading property details"
    >
      {/* ── Hero Gallery Skeleton ────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Main image skeleton (16:10 aspect ratio) */}
        <div className="mb-4 aspect-video animate-pulse rounded-2xl bg-neutral-300" />

        {/* Thumbnail grid skeleton */}
        <div className="grid grid-cols-4 gap-4 md:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="aspect-square animate-pulse rounded-lg bg-neutral-300"
            />
          ))}
        </div>
      </div>

      {/* ── Sticky Info Bar Skeleton ─────────────────────────────── */}
      <div className="sticky top-16 z-20 border-y border-neutral-200 bg-white py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row md:gap-8">
            {/* Price skeleton */}
            <div className="h-10 w-32 animate-pulse rounded-lg bg-neutral-300" />

            {/* Icon + text placeholders */}
            <div className="flex gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="size-6 animate-pulse rounded-full bg-neutral-300" />
                  <div className="h-4 w-16 animate-pulse rounded bg-neutral-300" />
                </div>
              ))}
            </div>

            {/* Button placeholders */}
            <div className="flex gap-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-10 w-32 animate-pulse rounded-lg bg-neutral-300"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content Grid ──────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-12 lg:grid-cols-[1fr_360px]">
          {/* Left Column (65%) */}
          <div className="space-y-12">
            {/* Section 1: About skeleton */}
            <div className="space-y-4">
              <div className="h-8 w-32 animate-pulse rounded-lg bg-neutral-300" />
              <div className="space-y-3">
                <div className="h-4 w-full animate-pulse rounded bg-neutral-300" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-neutral-300" />
                <div className="h-4 w-4/5 animate-pulse rounded bg-neutral-300" />
              </div>
            </div>

            {/* Section 2: Features grid skeleton */}
            <div className="space-y-4">
              <div className="h-8 w-32 animate-pulse rounded-lg bg-neutral-300" />
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-20 animate-pulse rounded-lg bg-neutral-300"
                  />
                ))}
              </div>
            </div>

            {/* Section 3: Additional info skeleton */}
            <div className="space-y-4">
              <div className="h-8 w-32 animate-pulse rounded-lg bg-neutral-300" />
              <div className="space-y-3">
                <div className="h-4 w-full animate-pulse rounded bg-neutral-300" />
                <div className="h-4 w-full animate-pulse rounded bg-neutral-300" />
              </div>
            </div>
          </div>

          {/* Right Column (35%) — Agent Card */}
          <div className="space-y-6">
            {/* Card skeleton */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-8">
              {/* Avatar skeleton */}
              <div className="mb-6 flex justify-center">
                <div className="size-24 animate-pulse rounded-full bg-neutral-300" />
              </div>

              {/* Text lines skeleton */}
              <div className="space-y-3 text-center">
                <div className="h-6 w-32 animate-pulse rounded-lg bg-neutral-300 mx-auto" />
                <div className="h-4 w-24 animate-pulse rounded bg-neutral-300 mx-auto" />
                <div className="h-4 w-28 animate-pulse rounded bg-neutral-300 mx-auto" />
              </div>

              {/* Button skeletons */}
              <div className="mt-8 space-y-3">
                <div className="h-10 animate-pulse rounded-lg bg-neutral-300" />
                <div className="h-10 animate-pulse rounded-lg bg-neutral-300" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
