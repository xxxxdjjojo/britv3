"use client";

import { getRentStatus } from "@/lib/rent-period";

type RentStatusIndicatorProps = Readonly<{
  tenancy: {
    lease_start_date: string;
    rent_amount: number;
    rent_frequency: string;
  };
  payments: ReadonlyArray<{
    category: string;
    entry_date: string;
    amount: number;
  }>;
}>;

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  paid: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-800 dark:text-green-300",
    label: "Paid",
  },
  partial: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-800 dark:text-amber-300",
    label: "Partial",
  },
  overdue: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-800 dark:text-red-300",
    label: "Overdue",
  },
  not_due: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-600 dark:text-gray-400",
    label: "Not Due",
  },
};

const gbpFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Displays the derived rent payment status for a tenancy.
 * Status is computed from payments in the current rent period -- not stored in DB.
 */
export function RentStatusIndicator({
  tenancy,
  payments,
}: RentStatusIndicatorProps) {
  const status = getRentStatus(tenancy, payments);
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.not_due;

  // Calculate total paid in current period for display
  const totalPaid = payments
    .filter((p) => p.category === "rent")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="flex items-center gap-3">
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
      >
        {style.label}
      </span>
      <span className="text-sm text-muted-foreground">
        {gbpFormatter.format(totalPaid)} / {gbpFormatter.format(tenancy.rent_amount)}
      </span>
    </div>
  );
}
