import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";

type KPICardProps = Readonly<{
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; direction: "up" | "down" };
}>;

export function KPICard({ title, value, icon: Icon, trend }: KPICardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex size-11 items-center justify-center rounded-lg bg-brand-primary-lighter text-brand-primary">
          <Icon className="size-5" />
        </div>
        {trend && (
          <span
            className={[
              "flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold",
              trend.direction === "up"
                ? "bg-success-light text-success"
                : "bg-error-light text-error",
            ].join(" ")}
          >
            {trend.direction === "up" ? (
              <TrendingUp className="size-3" />
            ) : (
              <TrendingDown className="size-3" />
            )}
            {trend.value > 0 ? "+" : ""}
            {trend.value}
          </span>
        )}
      </div>
      <p className="mb-1 text-sm font-medium text-neutral-500">{title}</p>
      <p className="text-3xl font-black tracking-tight text-neutral-900">{value}</p>
    </div>
  );
}
