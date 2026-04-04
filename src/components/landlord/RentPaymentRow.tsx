"use client";

import { useState } from "react";
import type { FinancialEntry } from "@/types/landlord";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

type RentPaymentRowEntry = FinancialEntry & {
  tenant_name: string;
  property_address: string;
};

type RentPaymentRowProps = Readonly<{
  entry: RentPaymentRowEntry;
  onMarkPaid: (id: string) => void;
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
};

const gbpFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Table row for one rent payment entry.
 * Columns: Property | Tenant | Due date | Amount | Status badge | Actions
 * Shows "Mark Paid" button for partial/overdue entries.
 */
export function RentPaymentRow({ entry, onMarkPaid }: RentPaymentRowProps) {
  const [isMarking, setIsMarking] = useState(false);

  const status = entry.payment_status ?? "overdue";
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.overdue;
  const canMarkPaid = status === "partial" || status === "overdue";

  async function handleMarkPaid() {
    setIsMarking(true);
    try {
      await onMarkPaid(entry.id);
    } finally {
      setIsMarking(false);
    }
  }

  return (
    <TableRow>
      <TableCell className="font-medium">
        {entry.property_address || "—"}
      </TableCell>
      <TableCell>{entry.tenant_name || "—"}</TableCell>
      <TableCell>
        {entry.entry_date ? formatDate(entry.entry_date) : "—"}
      </TableCell>
      <TableCell className="font-medium">
        {gbpFormatter.format(entry.amount)}
      </TableCell>
      <TableCell>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
        >
          {style.label}
        </span>
      </TableCell>
      <TableCell>
        {canMarkPaid && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkPaid}
            disabled={isMarking}
          >
            {isMarking ? "Saving..." : "Mark Paid"}
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
