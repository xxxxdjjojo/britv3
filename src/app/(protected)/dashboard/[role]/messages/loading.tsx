/**
 * Messages loading skeleton — matches 3-pane Stitch inbox layout.
 */

function SkeletonPulse(props: Readonly<{ className?: string }>) {
  return <div className={`animate-pulse bg-surface-container rounded ${props.className ?? ""}`} />;
}

export default function MessagesLoading() {
  return (
    <div className="min-h-screen bg-surface flex flex-col gap-4">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <SkeletonPulse className="h-6 w-32" />
        <SkeletonPulse className="h-5 w-16 rounded-full" />
      </div>

      {/* 3-pane skeleton */}
      <div className="overflow-hidden rounded-2xl bg-surface shadow-[0_4px_24px_rgba(26,28,28,0.06)]">
        <div className="flex h-[calc(100vh-12rem)] min-h-[400px]">
          {/* Left pane: conversation list */}
          <div className="w-80 bg-surface-container-low flex-shrink-0 hidden sm:flex flex-col p-6 space-y-4">
            {/* Search */}
            <SkeletonPulse className="h-10 w-full rounded-lg" />
            {/* Conversation rows */}
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-xl space-y-2">
                <div className="flex justify-between">
                  <SkeletonPulse className="h-2.5 w-20" />
                  <SkeletonPulse className="h-2.5 w-10" />
                </div>
                <SkeletonPulse className="h-3 w-2/3" />
                <SkeletonPulse className="h-2.5 w-3/4" />
              </div>
            ))}
          </div>

          {/* Center pane: thread */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Thread header */}
            <div className="px-6 py-4 border-b border-surface-container flex items-center gap-4">
              <SkeletonPulse className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <SkeletonPulse className="h-4 w-40" />
                <SkeletonPulse className="h-2.5 w-24" />
              </div>
            </div>
            {/* Message bubbles */}
            <div className="flex-1 px-8 py-4 space-y-8">
              <div className="flex gap-4 max-w-xl">
                <SkeletonPulse className="h-10 w-10 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <SkeletonPulse className="h-3 w-24" />
                  <SkeletonPulse className="h-20 w-full rounded-2xl" />
                </div>
              </div>
              <div className="flex gap-4 max-w-xl ml-auto flex-row-reverse">
                <SkeletonPulse className="h-10 w-10 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <SkeletonPulse className="h-3 w-24 ml-auto" />
                  <SkeletonPulse className="h-16 w-full rounded-2xl" />
                </div>
              </div>
              <div className="flex gap-4 max-w-sm">
                <SkeletonPulse className="h-10 w-10 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <SkeletonPulse className="h-3 w-24" />
                  <SkeletonPulse className="h-12 w-full rounded-2xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Right pane: action sidebar (lg+ only) */}
          <div className="w-72 bg-surface-container-low hidden lg:flex flex-col p-6 space-y-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-3">
                <SkeletonPulse className="h-2.5 w-24" />
                <SkeletonPulse className="h-16 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
