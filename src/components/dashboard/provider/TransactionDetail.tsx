import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  Briefcase,
  CreditCard,
  Receipt,
} from "lucide-react";
import type { TransactionDetail as TxDetail } from "@/services/provider/provider-payment-service";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatGBP(pence: number): string {
  return `£${(pence / 100).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: Readonly<{ status: string }>) {
  switch (status) {
    case "completed":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-light px-3 py-1 text-sm font-medium text-success">
          <CheckCircle2 className="size-4" />
          Completed
        </span>
      );
    case "pending":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-light px-3 py-1 text-sm font-medium text-warning">
          <Clock className="size-4" />
          Pending
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-error-light px-3 py-1 text-sm font-medium text-error">
          <XCircle className="size-4" />
          Failed
        </span>
      );
    case "refunded":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-600">
          <RotateCcw className="size-4" />
          Refunded
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-600">
          {status}
        </span>
      );
  }
}

// ---------------------------------------------------------------------------
// Amount breakdown row
// ---------------------------------------------------------------------------

function AmountRow(
  props: Readonly<{
    label: string;
    amount: string;
    note?: string;
    bold?: boolean;
    separator?: boolean;
    dimmed?: boolean;
  }>,
) {
  const { label, amount, note, bold, separator, dimmed } = props;
  return (
    <>
      {separator && <tr><td colSpan={2} className="py-1"><div className="border-t border-border" /></td></tr>}
      <tr>
        <td className={`py-2.5 text-sm ${dimmed ? "text-muted-foreground/60" : "text-muted-foreground"}`}>
          <span className={bold ? "font-semibold text-foreground" : ""}>{label}</span>
          {note && <span className="ml-1.5 text-xs text-muted-foreground/60">({note})</span>}
        </td>
        <td className={`py-2.5 text-right text-sm ${bold ? "font-bold text-foreground text-base" : dimmed ? "text-muted-foreground/60" : "text-foreground"}`}>
          {amount}
        </td>
      </tr>
    </>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function TransactionDetail(
  props: Readonly<{ transaction: TxDetail }>,
) {
  const { transaction: tx } = props;

  const stripeFeeEstimatePence = tx.grossAmountPence - tx.platformFeePence - tx.netAmountPence;
  // Only show Stripe fee row if it's non-zero (some transaction types may not have it)
  const hasStripeFee = stripeFeeEstimatePence > 0;

  const typeLabel: Record<string, string> = {
    job_payment: "Job Payment",
    platform_fee: "Platform Fee",
    refund: "Refund",
    payout: "Payout",
    adjustment: "Adjustment",
  };

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/provider/payments"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-brand-primary transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to Payments
      </Link>

      {/* Header card */}
      <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Receipt className="size-4 text-muted-foreground" />
              <span className="text-xs font-mono text-muted-foreground">{tx.id}</span>
            </div>
            <h1 className="font-heading text-xl font-bold text-foreground">
              {typeLabel[tx.type] ?? tx.type}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDateTime(tx.createdAt)}
            </p>
          </div>
          <StatusBadge status={tx.status} />
        </div>

        {/* Client / meta */}
        {(tx.clientName ?? tx.jobId) && (
          <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-4">
            {tx.clientName && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CreditCard className="size-4 text-muted-foreground" />
                <span>Client: <span className="font-medium text-foreground">{tx.clientName}</span></span>
              </div>
            )}
            {tx.jobId && (
              <Link
                href={`/dashboard/provider/jobs/${tx.jobId}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-brand-primary hover:underline"
              >
                <Briefcase className="size-4" />
                View related job
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Amount breakdown */}
      <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
        <h2 className="font-heading text-base font-semibold text-foreground mb-4">
          Amount Breakdown
        </h2>
        <table className="w-full">
          <tbody>
            <AmountRow
              label="Gross Amount"
              amount={formatGBP(tx.grossAmountPence)}
              note="charged to client"
            />
            {hasStripeFee && (
              <AmountRow
                label="Stripe Processing Fee"
                amount={`− ${formatGBP(stripeFeeEstimatePence)}`}
                dimmed
              />
            )}
            <AmountRow
              label="Platform Fee"
              amount={`− ${formatGBP(tx.platformFeePence)}`}
              note="2.5%"
              dimmed
            />
            <AmountRow
              label="Net Amount"
              amount={formatGBP(tx.netAmountPence)}
              bold
              separator
            />
          </tbody>
        </table>
      </div>

      {/* Stripe reference */}
      {tx.stripePaymentIntentId && (
        <div className="rounded-2xl border border-border bg-muted/40 p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Stripe Reference
          </p>
          <p className="text-sm font-mono text-foreground break-all">
            {tx.stripePaymentIntentId}
          </p>
        </div>
      )}
    </div>
  );
}
