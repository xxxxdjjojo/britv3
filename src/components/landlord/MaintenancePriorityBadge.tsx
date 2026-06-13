import { AlertTriangle, ArrowUp, Clock, ArrowDown } from "lucide-react";
import type { MaintenancePriority } from "@/types/landlord";

const PRIORITY_CONFIG: Record<
  MaintenancePriority,
  {
    label: string;
    icon: typeof AlertTriangle;
    className: string;
  }
> = {
  emergency: {
    label: "Emergency",
    icon: AlertTriangle,
    className: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  },
  high: {
    label: "High",
    icon: ArrowUp,
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
  },
  medium: {
    label: "Routine",
    icon: Clock,
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  },
  low: {
    label: "Low",
    icon: ArrowDown,
    className:
      "bg-muted text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  },
};

export function MaintenancePriorityBadge(
  props: Readonly<{ priority: MaintenancePriority }>,
) {
  const config = PRIORITY_CONFIG[props.priority];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${config.className}`}
    >
      <Icon className="size-3" aria-hidden="true" />
      {config.label}
    </span>
  );
}
