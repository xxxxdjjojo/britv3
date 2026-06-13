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
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
          <CheckCircle2 className="size-4" />
          Completed
        </span>
      );
    case "pending":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
          <Clock className="size-4" />
          Pending
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
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
      {separator && <tr><td colSpan={2} className="py-1"><div className="border-t border-neutral-200" /></td></tr>}
      <tr>
        <td className={`py-2.5 text-sm ${dimmed ? "text-neutral-400" : "text-neutral-600"}`}>
          <span className={bold ? "font-semibold text-neutral-900" : ""}>{label}</span>
          {note && <span className="ml-1.5 text-xs text-neutral-400">({note})</span>}
        </td>
        <td className={`py-2.5 text-right text-sm ${bold ? "font-bold text-neutral-900 text-base" : dimmed ? "text-neutral-400" : "text-neutral-900"}`}>
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
        className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-brand-primary transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to Payments
      </Link>

      {/* Header card */}
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Receipt className="size-4 text-neutral-400" />
              <span className="text-xs font-mono text-neutral-400">{tx.id}</span>
            </div>
            <h1 className="text-xl font-bold text-neutral-900">
              {typeLabel[tx.type] ?? tx.type}
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              {formatDateTime(tx.createdAt)}
            </p>
          </div>
          <StatusBadge status={tx.status} />
        </div>

        {/* Client / meta */}
        {(tx.clientName ?? tx.jobId) && (
          <div className="mt-4 pt-4 border-t border-neutral-100 flex flex-wrap gap-4">
            {tx.clientName && (
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <CreditCard className="size-4 text-neutral-400" />
                <span>Client: <span className="font-medium text-neutral-900">{tx.clientName}</span></span>
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
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm p-6">
        <h2 className="text-base font-semibold text-neutral-900 mb-4">
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
        <div className="rounded-xl border border-neutral-200 bg-surface p-4">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
            Stripe Reference
          </p>
          <p className="text-sm font-mono text-neutral-700 break-all">
            {tx.stripePaymentIntentId}
          </p>
        </div>
      )}
    </div>
  );
}
