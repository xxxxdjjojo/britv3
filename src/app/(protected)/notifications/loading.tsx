export default function NotificationsLoading() {
  return (
    <div
      className="mx-auto max-w-2xl px-4 py-8 space-y-6"
      role="status"
      aria-label="Loading notifications"
    >
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="h-9 w-28 rounded-md bg-muted animate-pulse" />
      </div>

      {/* ── Tab Bar ──────────────────────────────────────────────────── */}
      <div className="flex gap-2 border-b border-border pb-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-9 w-20 rounded-t-md bg-muted animate-pulse"
          />
        ))}
      </div>

      {/* ── Notification Cards ───────────────────────────────────────── */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border p-4">
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
              </div>
              <div className="h-3 w-12 rounded bg-muted shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
