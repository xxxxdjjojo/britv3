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
  critical: "border-l-red-500 bg-red-50 dark:bg-red-900/10",
  warning: "border-l-amber-500 bg-amber-50 dark:bg-amber-900/10",
  info: "border-l-slate-300 bg-white dark:border-l-slate-600 dark:bg-slate-900",
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
      <div className="flex items-center gap-3 rounded-xl border bg-white p-5 text-sm text-muted-foreground dark:bg-slate-900">
        <Calendar className="size-5 text-emerald-500" />
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
          <span className="w-14 shrink-0 text-xs font-bold tabular-nums text-slate-500">
            {formatShortDate(d.event_date)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
              {d.title}
            </p>
            <p className="truncate text-xs text-slate-500">
              {d.property_address}
            </p>
          </div>
          <ArrowRight className="size-4 shrink-0 text-slate-400" />
        </Link>
      ))}
    </div>
  );
}
