function SkeletonConversationRow() {
  return (
    <div className="flex items-center gap-3 px-3 py-3 animate-pulse">
      <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-1/2 rounded bg-muted" />
        <div className="h-3 w-3/4 rounded bg-muted" />
      </div>
    </div>
  );
}

export default function InboxLoading() {
  return (
    <div
      className="flex h-[calc(100dvh-4rem)] overflow-hidden"
      role="status"
      aria-label="Loading inbox"
    >
      {/* ── Left Panel: Conversation List ───────────────────────────── */}
      <div className="w-full md:max-w-xs md:border-r md:border-border flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <div className="h-6 w-24 rounded bg-muted animate-pulse" />
          <div className="h-8 w-8 rounded-md bg-muted animate-pulse" />
        </div>

        {/* Search bar skeleton */}
        <div className="px-3 py-3 border-b border-border">
          <div className="h-9 w-full rounded-lg bg-muted animate-pulse" />
        </div>

        {/* Conversation rows */}
        <div className="flex-1 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonConversationRow key={i} />
          ))}
        </div>
      </div>

      {/* ── Right Panel: Message Thread ──────────────────────────────── */}
      <div className="hidden md:flex flex-1 flex-col">
        {/* Thread header skeleton */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border animate-pulse">
          <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
          <div className="space-y-2">
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="h-3 w-20 rounded bg-muted" />
          </div>
        </div>

        {/* Message area skeleton */}
        <div className="flex-1 px-6 py-6 space-y-4">
          {/* Incoming message */}
          <div className="flex items-end gap-2 animate-pulse">
            <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
            <div className="h-12 w-2/3 rounded-2xl rounded-bl-none bg-muted" />
          </div>
          {/* Outgoing message */}
          <div className="flex items-end justify-end gap-2 animate-pulse">
            <div className="h-10 w-1/2 rounded-2xl rounded-br-none bg-muted" />
          </div>
          {/* Incoming message */}
          <div className="flex items-end gap-2 animate-pulse">
            <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
            <div className="h-16 w-3/5 rounded-2xl rounded-bl-none bg-muted" />
          </div>
          {/* Outgoing message */}
          <div className="flex items-end justify-end gap-2 animate-pulse">
            <div className="h-12 w-2/5 rounded-2xl rounded-br-none bg-muted" />
          </div>
        </div>

        {/* Message input skeleton */}
        <div className="px-6 py-4 border-t border-border animate-pulse">
          <div className="h-12 w-full rounded-xl bg-muted" />
        </div>
      </div>
    </div>
  );
}
