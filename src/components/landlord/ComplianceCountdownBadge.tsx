import { cn } from "@/lib/utils";

export type CountdownVariant = "expired" | "critical" | "warning" | "safe";

export function getCountdownVariant(daysUntilExpiry: number): CountdownVariant {
  if (daysUntilExpiry <= 0) return "expired";
  if (daysUntilExpiry <= 7) return "critical";
  if (daysUntilExpiry <= 30) return "warning";
  return "safe";
}

const VARIANT_STYLES: Record<CountdownVariant, string> = {
  expired: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse",
  critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  safe: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

type Props = Readonly<{
  daysUntilExpiry: number;
  className?: string;
}>;

export function ComplianceCountdownBadge({ daysUntilExpiry, className }: Props) {
  const variant = getCountdownVariant(daysUntilExpiry);
  const label = variant === "expired" ? "EXPIRED" : `${daysUntilExpiry}d`;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold tabular-nums",
        VARIANT_STYLES[variant],
        className,
      )}
    >
      {label}
    </span>
  );
}
