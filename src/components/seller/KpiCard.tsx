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
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-neutral-500 font-inter">{label}</p>
          <p className="text-3xl font-extrabold text-[--color-neutral-900] mt-1 font-['Plus_Jakarta_Sans'] tracking-tight">{value}</p>
        </div>
        <span className={cn("flex h-11 w-11 items-center justify-center rounded-xl flex-shrink-0 ml-3", iconBgClass)}>
          <Icon className={cn("h-5 w-5", iconColorClass)} strokeWidth={1.25} />
        </span>
      </div>
      {changePct !== undefined && (
        <div className="mt-4 flex items-center gap-1.5">
          {isPositive ? (
            <TrendingUp className="h-3.5 w-3.5 text-[--color-success]" strokeWidth={1.25} />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-[--color-error]" strokeWidth={1.25} />
          )}
          <span className={cn(
            "text-xs font-semibold px-2 py-0.5 rounded-full",
            isPositive ? "bg-[--color-success-light] text-[--color-success]" : "bg-[--color-error-light] text-[--color-error]",
          )}>
            {isPositive ? "+" : ""}{changePct}%
          </span>
          <span className="text-xs text-[--color-neutral-400]">vs last 30 days</span>
        </div>
      )}
    </div>
  );
}
