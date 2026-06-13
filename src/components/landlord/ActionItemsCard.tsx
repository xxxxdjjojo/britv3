import Link from "next/link";
import { ArrowRight, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScoredActionItem } from "@/services/landlord/action-items-service";

type ActionItemsCardProps = Readonly<{
  items: ScoredActionItem[];
}>;

const URGENCY_ICON = {
  critical: AlertTriangle,
  warning: AlertCircle,
  info: Info,
} as const;

const URGENCY_STYLES = {
  critical: "text-red-500",
  warning: "text-amber-500",
  info: "text-slate-400",
} as const;

export function ActionItemsCard({ items }: ActionItemsCardProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="flex items-center gap-2 text-lg font-bold">
        <AlertTriangle className="size-5 text-amber-500" />
        Do These Now
      </h3>
      <div className="space-y-2">
        {items.slice(0, 3).map((item, i) => {
          const Icon = URGENCY_ICON[item.urgency];
          return (
            <Link
              key={`${item.type}-${i}`}
              href={item.href}
              className="group flex items-start gap-3 rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <Icon className={cn("mt-0.5 size-5 shrink-0", URGENCY_STYLES[item.urgency])} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 group-hover:text-brand-primary dark:text-slate-100">
                  {item.title}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>
              </div>
              <ArrowRight className="mt-1 size-4 shrink-0 text-slate-300 group-hover:text-brand-primary" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
