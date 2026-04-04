import type { BookingStatus } from "@/types/marketplace";
import { cn } from "@/lib/utils";

type BookingStatusBadgeProps = Readonly<{
  status: BookingStatus;
  className?: string;
}>;

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; className: string }
> = {
  pending_confirmation: {
    label: "Pending",
    className: "bg-warning-light text-warning dark:bg-warning/20 dark:text-warning",
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-brand-accent-light text-brand-accent dark:bg-brand-accent/20 dark:text-brand-accent",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-warning-light text-warning dark:bg-warning/20 dark:text-warning",
  },
  completed: {
    label: "Completed",
    className: "bg-success-light text-success dark:bg-success/20 dark:text-success",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-error-light text-error dark:bg-error/20 dark:text-error",
  },
  disputed: {
    label: "Disputed",
    className: "bg-brand-accent-light text-brand-accent dark:bg-brand-accent/20 dark:text-brand-accent",
  },
};

export function BookingStatusBadge({
  status,
  className,
}: BookingStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 font-body text-xs font-medium",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
