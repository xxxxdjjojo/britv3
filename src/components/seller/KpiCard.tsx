import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = Readonly<{
  label: string;
  value: string | number;
  changePct?: number;
  icon: LucideIcon;
  iconBgClass: string;
  iconColorClass: string;
}>;

export function KpiCard({ label, value, changePct, icon: Icon, iconBgClass, iconColorClass }: Props) {
  const isPositive = (changePct ?? 0) >= 0;
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">{value}</p>
        </div>
        <span className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", iconBgClass)}>
          <Icon className={cn("h-6 w-6", iconColorClass)} />
        </span>
      </div>
      {changePct !== undefined && (
        <div className="mt-4 flex items-center gap-1.5">
          {isPositive ? (
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-red-500" />
          )}
          <span className={cn(
            "text-xs font-semibold px-2 py-0.5 rounded-full",
            isPositive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600",
          )}>
            {isPositive ? "+" : ""}{changePct}%
          </span>
          <span className="text-xs text-slate-400">vs last 30 days</span>
        </div>
      )}
    </div>
  );
}
