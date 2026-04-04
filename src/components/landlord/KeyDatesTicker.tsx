import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type KeyDate = Readonly<{
  event_date: string;
  event_type: string;
  title: string;
  property_address: string;
  property_id: string;
  urgency: "critical" | "warning" | "info";
}>;

type KeyDatesTickerProps = Readonly<{
  dates: KeyDate[];
}>;

const URGENCY_STYLES = {
  critical: "border-l-error bg-error-light dark:bg-error/10",
  warning: "border-l-warning bg-warning-light dark:bg-warning/10",
  info: "border-l-neutral-300 bg-white dark:border-l-neutral-600 dark:bg-neutral-900",
} as const;

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function KeyDatesTicker({ dates }: KeyDatesTickerProps) {
  if (dates.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border bg-white p-5 text-sm text-muted-foreground dark:bg-neutral-900">
        <Calendar className="size-5 text-success" />
        No upcoming deadlines in the next 60 days — all clear.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {dates.slice(0, 6).map((d, i) => (
        <Link
          key={`${d.event_type}-${d.property_id}-${i}`}
          href={`/dashboard/landlord/properties/${d.property_id}`}
          className={cn(
            "flex items-center gap-3 rounded-lg border-l-4 px-4 py-3 transition-shadow hover:shadow-sm",
            URGENCY_STYLES[d.urgency],
          )}
        >
          <span className="w-14 shrink-0 text-xs font-bold tabular-nums text-neutral-500">
            {formatShortDate(d.event_date)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {d.title}
            </p>
            <p className="truncate text-xs text-neutral-500">
              {d.property_address}
            </p>
          </div>
          <ArrowRight className="size-4 shrink-0 text-neutral-500" />
        </Link>
      ))}
    </div>
  );
}
