import type { MaintenanceRequest } from "@/types/landlord";
import { MaintenanceStatusBadge } from "./MaintenanceStatusBadge";

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-neutral-100 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300",
  medium: "bg-brand-accent-light text-brand-accent dark:bg-brand-accent/10 dark:text-brand-accent",
  high: "bg-warning-light text-warning dark:bg-warning/10 dark:text-warning",
  emergency: "bg-error-light text-error dark:bg-error/10 dark:text-error",
};

function PriorityBadge(props: Readonly<{ priority: string }>) {
  const style = PRIORITY_STYLES[props.priority] ?? PRIORITY_STYLES.medium;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${style}`}
    >
      {props.priority}
    </span>
  );
}

export function MaintenanceList(
  props: Readonly<{ requests: MaintenanceRequest[] }>,
) {
  if (props.requests.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-600">
        <p className="text-sm text-neutral-500 dark:text-neutral-500">
          No maintenance requests
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-600 dark:border-neutral-600">
      {props.requests.map((req) => (
        <a
          key={req.id}
          href={`maintenance/${req.id}`}
          className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {req.title}
            </p>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-500">
              {new Date(req.created_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PriorityBadge priority={req.priority} />
            <MaintenanceStatusBadge status={req.status} />
          </div>
        </a>
      ))}
    </div>
  );
}
