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
      <div className={cn("text-sm text-muted-foreground", className)}>
        No status history available.
      </div>
    );
  }

  return (
    <div className={cn("relative space-y-0", className)}>
      <h3 className="mb-4 text-sm font-semibold text-foreground">
        Status History
      </h3>
      <ol className="relative border-l border-border">
        {sorted.map((entry, index) => {
          const isCurrent = index === 0 && entry.to_status === currentStatus;

          return (
            <li key={entry.id} className="mb-6 ml-6 last:mb-0">
              <span
                className={cn(
                  "absolute -left-2 flex size-4 items-center justify-center rounded-full ring-4 ring-background",
                  isCurrent
                    ? "bg-primary"
                    : "bg-muted-foreground/30",
                )}
              />
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <BookingStatusBadge status={entry.to_status} />
                  {entry.from_status && (
                    <span className="text-xs text-muted-foreground">
                      from{" "}
                      <BookingStatusBadge status={entry.from_status} />
                    </span>
                  )}
                </div>
                <time className="text-xs text-muted-foreground">
                  {formatDate(entry.created_at)}
                </time>
                {entry.changed_by && (
                  <span className="text-xs text-muted-foreground">
                    Changed by: {entry.changed_by}
                  </span>
                )}
                {entry.reason && (
                  <p className="mt-1 text-sm text-muted-foreground italic">
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
