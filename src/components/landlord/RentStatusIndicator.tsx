
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
    bg: "bg-success-light dark:bg-success/10",
    text: "text-success dark:text-success",
    label: "Paid",
  },
  partial: {
    bg: "bg-warning-light dark:bg-warning/10",
    text: "text-warning dark:text-warning",
    label: "Partial",
  },
  overdue: {
    bg: "bg-error-light dark:bg-error/10",
    text: "text-error dark:text-error",
    label: "Overdue",
  },
  not_due: {
    bg: "bg-neutral-100 dark:bg-neutral-800",
    text: "text-neutral-600 dark:text-neutral-400",
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
