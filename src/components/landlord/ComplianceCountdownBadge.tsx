import { cn } from "@/lib/utils";

export type CountdownVariant = "expired" | "critical" | "warning" | "safe";

export function getCountdownVariant(daysUntilExpiry: number): CountdownVariant {
  if (daysUntilExpiry <= 0) return "expired";
  if (daysUntilExpiry <= 7) return "critical";
  if (daysUntilExpiry <= 30) return "warning";
  return "safe";
}

const VARIANT_STYLES: Record<CountdownVariant, string> = {
  expired: "bg-error-light text-error animate-pulse",
  critical: "bg-error-light text-error",
  warning: "bg-warning-light text-warning",
  safe: "bg-success-light text-success",
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
