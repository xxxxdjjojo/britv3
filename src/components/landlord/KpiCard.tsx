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
    "rounded-xl border p-6 shadow-sm transition-shadow hover:shadow-md",
    variant === "warning" && "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/10",
    variant === "danger" && "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/10",
    variant === "default" && "bg-card",
  );

  const iconContainerClass = cn(
    "flex size-12 items-center justify-center rounded-xl",
    variant === "default" && "bg-brand-primary/10 text-brand-primary",
    variant === "warning" && "bg-amber-100 text-amber-600",
    variant === "danger" && "bg-red-100 text-red-600",
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
              "flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold",
              isPositiveTrend
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
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
      <p className="mb-1 text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
      <h3 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
        {value}
      </h3>
    </div>
  );
}
