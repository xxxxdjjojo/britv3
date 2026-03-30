import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

type KpiCardProps = Readonly<{
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  variant?: "default" | "warning" | "danger";
}>;

export function KpiCard({ title, value, icon: Icon, trend, variant = "default" }: KpiCardProps) {
  const cardClass = cn(
    "bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 dark:bg-neutral-900 dark:border-neutral-800",
    variant === "warning" && "border-warning/40 bg-warning-light dark:border-warning/30 dark:bg-warning/10",
    variant === "danger" && "border-error/40 bg-error-light dark:border-error/30 dark:bg-error/10",
  );

  const iconContainerClass = cn(
    "flex size-12 items-center justify-center rounded-xl",
    variant === "default" && "bg-brand-primary/10 text-brand-primary",
    variant === "warning" && "bg-warning-light text-warning",
    variant === "danger" && "bg-error-light text-error",
  );

  const isPositiveTrend = trend && trend.value >= 0;

  return (
    <div className={cardClass}>
      <div className="mb-4 flex items-center justify-between">
        <div className={iconContainerClass}>
          <Icon className="size-6" />
        </div>
        {trend && (
          <span
            className={cn(
              "flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold",
              isPositiveTrend
                ? "bg-success-light text-success dark:bg-success/10 dark:text-success"
                : "bg-error-light text-error dark:bg-error/10 dark:text-error",
            )}
          >
            {isPositiveTrend ? (
              <TrendingUp className="size-3" />
            ) : (
              <TrendingDown className="size-3" />
            )}
            {trend.label}
          </span>
        )}
      </div>
      <p className="mb-1 text-sm font-medium text-neutral-500 dark:text-neutral-400">{title}</p>
      <h3 className="font-heading text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
        {value}
      </h3>
    </div>
  );
}
