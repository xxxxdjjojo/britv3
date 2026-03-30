import type { MaintenanceStatus } from "@/types/landlord";

const STATUS_STYLES: Record<MaintenanceStatus, string> = {
  new: "bg-brand-accent/10 text-brand-accent",
  acknowledged: "bg-brand-primary/10 text-brand-primary",
  assigned: "bg-warning-light text-warning",
  in_progress: "bg-warning-light text-warning",
  resolved: "bg-success-light text-success",
  closed: "bg-muted text-muted-foreground",
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
