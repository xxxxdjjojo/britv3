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
    className: "bg-error-light text-error",
  },
  high: {
    label: "High",
    icon: ArrowUp,
    className: "bg-warning-light text-warning",
  },
  medium: {
    label: "Routine",
    icon: Clock,
    className: "bg-brand-accent/10 text-brand-accent",
  },
  low: {
    label: "Low",
    icon: ArrowDown,
    className: "bg-muted text-muted-foreground",
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
