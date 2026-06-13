import type { UpcomingJobSummary } from "@/services/provider/provider-dashboard-service";
import { CalendarDays } from "lucide-react";
import Link from "next/link";

type UpcomingJobsListProps = Readonly<{
  jobs: UpcomingJobSummary[];
}>;

const STATUS_CLASSES: Record<string, string> = {
  scheduled: "bg-neutral-100 text-neutral-700",
  confirmed: "bg-[#E8F5EE] text-brand-primary",
  en_route: "bg-blue-50 text-blue-700",
  in_progress: "bg-amber-50 text-amber-700",
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  en_route: "En Route",
  in_progress: "In Progress",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function UpcomingJobsList({ jobs }: UpcomingJobsListProps) {
  if (jobs.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-neutral-500">
        No upcoming jobs scheduled.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-neutral-100">
      {jobs.map((job) => {
        const statusClass = STATUS_CLASSES[job.status] ?? "bg-neutral-100 text-neutral-700";
        const statusLabel = STATUS_LABELS[job.status] ?? job.status;
        return (
          <li key={job.id} className="py-3 first:pt-0 last:pb-0">
            <Link
              href={`/dashboard/provider/jobs/active/${job.id}`}
              className="flex items-start gap-3 rounded-lg transition-colors hover:bg-surface -mx-2 px-2"
            >
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#E8F5EE] text-brand-primary">
                <CalendarDays className="size-4" />
              </span>
              <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {job.clientName}
                </p>
                <p className="text-xs text-neutral-500 truncate">{job.serviceType}</p>
                <p className="text-xs text-neutral-400">{formatDate(job.scheduledDate)}</p>
              </div>
              <span
                className={[
                  "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  statusClass,
                ].join(" ")}
              >
                {statusLabel}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
