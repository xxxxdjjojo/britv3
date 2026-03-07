import type { MaintenanceRequest } from "@/types/landlord";
import { MaintenanceStatusBadge } from "./MaintenanceStatusBadge";

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  emergency: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
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
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No maintenance requests
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 dark:divide-gray-700 dark:border-gray-700">
      {props.requests.map((req) => (
        <a
          key={req.id}
          href={`maintenance/${req.id}`}
          className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
              {req.title}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
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
