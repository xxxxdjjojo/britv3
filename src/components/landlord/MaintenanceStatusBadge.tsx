import type { MaintenanceStatus } from "@/types/landlord";

const STATUS_STYLES: Record<MaintenanceStatus, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  acknowledged:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  assigned:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  in_progress:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  resolved:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  closed: "bg-muted text-gray-800 dark:bg-gray-700 dark:text-gray-200",
};

const STATUS_LABELS: Record<MaintenanceStatus, string> = {
  new: "New",
  acknowledged: "Acknowledged",
  assigned: "Assigned",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

export function MaintenanceStatusBadge(
  props: Readonly<{ status: MaintenanceStatus }>,
) {
  const style = STATUS_STYLES[props.status];
  const label = STATUS_LABELS[props.status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {label}
    </span>
  );
}
