import type { BookingStatusHistory } from "@/types/marketplace";
import { BookingStatusBadge } from "./BookingStatusBadge";
import type { BookingStatus } from "@/types/marketplace";
import { cn } from "@/lib/utils";

type BookingTimelineProps = Readonly<{
  entries: BookingStatusHistory[];
  currentStatus: BookingStatus;
  className?: string;
}>;

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function BookingTimeline({
  entries,
  currentStatus,
  className,
}: BookingTimelineProps) {
  const sorted = [...entries].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  if (sorted.length === 0) {
    return (
      <div className={cn("font-body text-sm text-neutral-500", className)}>
        No status history available.
      </div>
    );
  }

  return (
    <div className={cn("relative space-y-0", className)}>
      <ol className="relative border-l border-neutral-200 dark:border-neutral-700">
        {sorted.map((entry, index) => {
          const isCurrent = index === 0 && entry.to_status === currentStatus;

          return (
            <li key={entry.id} className="mb-6 ml-6 last:mb-0">
              <span
                className={cn(
                  "absolute -left-2 flex size-4 items-center justify-center rounded-full ring-4 ring-background",
                  isCurrent
                    ? "bg-brand-primary"
                    : "bg-neutral-300 dark:bg-neutral-600",
                )}
              />
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <BookingStatusBadge status={entry.to_status} />
                  {entry.from_status && (
                    <span className="font-body text-xs text-neutral-500">
                      from{" "}
                      <BookingStatusBadge status={entry.from_status} />
                    </span>
                  )}
                </div>
                <time className="font-body text-xs text-neutral-500">
                  {formatDate(entry.created_at)}
                </time>
                {entry.changed_by && (
                  <span className="font-body text-xs text-neutral-500">
                    Changed by: {entry.changed_by}
                  </span>
                )}
                {entry.reason && (
                  <p className="mt-1 font-body text-sm text-neutral-500 italic">
                    &ldquo;{entry.reason}&rdquo;
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
