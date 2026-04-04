import Link from "next/link";
import { AlertTriangle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ComplianceAlertBannerProps = Readonly<{
  type: string;
  propertyAddress: string;
  expiryDate: string;
  daysUntilExpiry: number;
}>;

/** Formats a category key into a human-readable label. */
function formatCategory(type: string): string {
  const labels: Record<string, string> = {
    gas_safety: "Gas Safety Certificate",
    electrical_eicr: "EICR Inspection",
    epc: "EPC Certificate",
  };
  return labels[type] ?? type;
}

export function ComplianceAlertBanner({
  type,
  propertyAddress,
  expiryDate,
  daysUntilExpiry,
}: ComplianceAlertBannerProps) {
  const isExpired = daysUntilExpiry <= 0;
  const formattedDate = new Date(expiryDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div
      className={cn(
        "flex items-start gap-4 rounded-xl border-l-4 p-4",
        isExpired
          ? "border-error bg-error-light dark:bg-error/5"
          : "border-warning bg-warning-light dark:bg-warning/5",
      )}
    >
      <div className={cn("pt-0.5", isExpired ? "text-error" : "text-warning")}>
        {isExpired ? <AlertCircle className="size-5" /> : <AlertTriangle className="size-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
          {formatCategory(type)}
        </p>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-2 truncate">
          {propertyAddress}
        </p>
        <span
          className={cn(
            "inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
            isExpired
              ? "bg-error-light text-error dark:bg-error/10 dark:text-error"
              : "bg-warning-light text-warning dark:bg-warning/10 dark:text-warning",
          )}
        >
          {isExpired
            ? `Expired on ${formattedDate}`
            : `Due in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? "s" : ""}`}
        </span>
      </div>
      <Link
        href="/dashboard/landlord/compliance"
        className={cn(
          "shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
          isExpired
            ? "bg-error-light text-error hover:bg-error-light/80 dark:bg-error/10 dark:text-error"
            : "bg-warning-light text-warning hover:bg-warning-light/80 dark:bg-warning/10 dark:text-warning",
        )}
      >
        Fix Now
      </Link>
    </div>
  );
}
