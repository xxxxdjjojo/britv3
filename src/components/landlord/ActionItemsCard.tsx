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
  critical: "text-error",
  warning: "text-warning",
  info: "text-neutral-400",
} as const;

export function ActionItemsCard({ items }: ActionItemsCardProps) {
  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 dark:bg-neutral-900 dark:border-neutral-800">
      <h3 className="flex items-center gap-2 font-heading text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
        <AlertTriangle className="size-5 text-warning" />
        Action Required
      </h3>
      <div className="space-y-3">
        {items.slice(0, 3).map((item, i) => {
          const Icon = URGENCY_ICON[item.urgency];
          return (
            <Link
              key={`${item.type}-${i}`}
              href={item.href}
              aria-label={item.title}
              className="group flex items-start gap-3 rounded-xl border border-neutral-100 bg-neutral-50 p-4 transition-all hover:border-brand-primary/20 hover:bg-brand-primary/5 dark:border-neutral-800 dark:bg-neutral-800/50"
            >
              <Icon className={cn("mt-0.5 size-5 shrink-0", URGENCY_STYLES[item.urgency])} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-neutral-900 group-hover:text-brand-primary dark:text-neutral-100">
                  {item.title}
                </p>
                <p className="mt-0.5 text-xs text-neutral-500">{item.description}</p>
              </div>
              <ArrowRight className="mt-1 size-4 shrink-0 text-neutral-300 group-hover:text-brand-primary transition-colors" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
