"use client";

import type { DepositRegistration, DepositStatus } from "@/types/landlord";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type DepositCardDeposit = DepositRegistration & {
  tenancy: {
    tenant_name: string;
    property_address: string;
  };
};

type DepositCardProps = Readonly<{
  deposit: DepositCardDeposit;
  onEdit: (deposit: DepositCardDeposit) => void;
  onMarkRegistered?: (id: string) => void;
}>;

const STATUS_STYLES: Record<
  DepositStatus,
  { bg: string; text: string; label: string }
> = {
  pending: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-800 dark:text-amber-300",
    label: "Pending",
  },
  registered: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-800 dark:text-green-300",
    label: "Registered",
  },
  returned: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-600 dark:text-gray-400",
    label: "Returned",
  },
  disputed: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-800 dark:text-red-300",
    label: "Disputed",
  },
};

const SCHEME_LABELS: Record<string, string> = {
  TDS: "TDS",
  DPS: "DPS",
  mydeposits: "mydeposits",
  other: "Other",
};

const gbpFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function formatUKDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Card showing one deposit registration with scheme, status, dates, and actions.
 * Actions: Edit button + Mark Registered (if pending).
 */
export function DepositCard({ deposit, onEdit, onMarkRegistered }: DepositCardProps) {
  const statusStyle = STATUS_STYLES[deposit.status] ?? STATUS_STYLES.pending;
  const schemeName = SCHEME_LABELS[deposit.scheme] ?? deposit.scheme;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <p className="font-medium text-sm">
              {deposit.tenancy.property_address || "Unknown property"}
            </p>
            <p className="text-xs text-muted-foreground">
              {deposit.tenancy.tenant_name}
            </p>
          </div>
          <span
            className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
          >
            {statusStyle.label}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Amount */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Deposit amount</span>
          <span className="font-semibold">{gbpFormatter.format(deposit.amount)}</span>
        </div>

        {/* Scheme */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Scheme</span>
          <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">
            {schemeName}
          </span>
        </div>

        {/* Registration date */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Registered</span>
          {deposit.registration_date ? (
            <span>{formatUKDate(deposit.registration_date)}</span>
          ) : (
            <span className="text-amber-600 dark:text-amber-400">
              Not registered
            </span>
          )}
        </div>

        {/* Prescribed info sent */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Prescribed info sent</span>
          {deposit.prescribed_info_sent_date ? (
            <span>{formatUKDate(deposit.prescribed_info_sent_date)}</span>
          ) : (
            <span className="text-amber-600 dark:text-amber-400">Not sent</span>
          )}
        </div>

        {/* Scheme reference */}
        {deposit.scheme_reference && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Ref</span>
            <span className="font-mono text-xs">{deposit.scheme_reference}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(deposit)}
          >
            Edit
          </Button>
          {deposit.status === "pending" && onMarkRegistered && (
            <Button
              size="sm"
              className="flex-1"
              onClick={() => onMarkRegistered(deposit.id)}
            >
              Mark Registered
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
