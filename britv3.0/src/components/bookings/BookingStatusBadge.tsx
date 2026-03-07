import { Badge } from "@/components/ui/badge";
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
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  },
  completed: {
    label: "Completed",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
  disputed: {
    label: "Disputed",
    className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  },
};

export function BookingStatusBadge({
  status,
  className,
}: BookingStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent font-medium",
        config.className,
        className,
      )}
    >
      {config.label}
    </Badge>
  );
}
