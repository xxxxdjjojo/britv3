
import Link from "next/link";
import { Calendar, Clock, CheckCircle2, XCircle, ArrowUpRight } from "lucide-react";
import type { StripeBalance, PayoutRecord } from "@/services/provider/provider-payment-service";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatGBP(pence: number): string {
  return `£${(pence / 100).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatPayoutDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

type PayoutStatus = "paid" | "pending" | "in_transit" | "failed" | "cancelled";

function statusConfig(
  status: string,
): { label: string; className: string; Icon: React.ElementType } {
  switch (status as PayoutStatus) {
    case "paid":
      return {
        label: "Paid",
        className:
          "bg-brand-primary-lighter text-brand-primary dark:bg-brand-primary/20 dark:text-brand-primary",
        Icon: CheckCircle2,
      };
    case "in_transit":
      return {
        label: "In Transit",
        className:
          "bg-info-light text-info dark:bg-info/10 dark:text-info",
        Icon: Clock,
      };
    case "pending":
      return {
        label: "Pending",
        className:
          "bg-warning-light text-warning dark:bg-warning/10 dark:text-warning",
        Icon: Clock,
      };
    case "failed":
    case "cancelled":
      return {
        label: status === "failed" ? "Failed" : "Cancelled",
        className:
          "bg-error-light text-error dark:bg-error/10 dark:text-error",
        Icon: XCircle,
      };
    default:
      return {
        label: status,
        className:
          "bg-muted text-muted-foreground",
        Icon: Clock,
      };
  }
}

// ---------------------------------------------------------------------------
// Balance cards
// ---------------------------------------------------------------------------

function BalanceCards(
  props: Readonly<{ balance: StripeBalance }>,
) {
  const { balance } = props;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* Available — primary hero card */}
      <div className="rounded-2xl bg-brand-primary p-6 text-white">
        <p className="text-sm font-medium text-white/70">
          Available for Withdrawal
        </p>
        <p className="mt-2 font-heading text-3xl font-bold">
          {formatGBP(balance.availablePence)}
        </p>
        <p className="mt-1 text-xs uppercase tracking-wide text-white/60">
          {balance.currency.toUpperCase()} · Ready to pay out
        </p>
      </div>

      {/* Pending */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">
          Total Earnings YTD
        </p>
        <p className="mt-2 font-heading text-3xl font-bold text-foreground">
          {formatGBP(balance.pendingPence)}
        </p>
        <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
          In transit · Not yet available
        </p>
      </div>

      {/* Next payout amount (when available) */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">
          Pending Payouts
        </p>
        <p className="mt-2 font-heading text-3xl font-bold text-foreground">
          {balance.nextPayoutAmountPence !== null
            ? formatGBP(balance.nextPayoutAmountPence)
            : "—"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {balance.nextPayoutDate
            ? `Due ${formatPayoutDate(balance.nextPayoutDate)}`
            : "No upcoming payout scheduled"}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Payout ETA banner
// ---------------------------------------------------------------------------

function PayoutEtaBanner(
  props: Readonly<{ balance: StripeBalance }>,
) {
  const { balance } = props;
  if (!balance.nextPayoutDate || balance.nextPayoutAmountPence === null) {
    return null;
  }

  return (
    <div className="rounded-lg border-l-4 border-brand-primary bg-brand-primary-lighter px-5 py-4">
      <div className="flex items-center gap-3">
        <Calendar className="size-5 shrink-0 text-brand-primary" />
        <div>
          <p className="text-sm font-semibold text-brand-primary">
            Next payout:{" "}
            <span className="font-bold">
              {formatGBP(balance.nextPayoutAmountPence)}
            </span>{" "}
            arriving{" "}
            <span className="font-bold">
              {formatPayoutDate(balance.nextPayoutDate)}
            </span>
          </p>
          <p className="mt-0.5 text-xs text-brand-primary/70">
            Stripe typically takes 2 business days to process payouts.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Payout history table row
// ---------------------------------------------------------------------------

function PayoutRow(
  props: Readonly<{ payout: PayoutRecord }>,
) {
  const { payout } = props;
  const { label, className, Icon } = statusConfig(payout.status);
  return (
    <tr className="border-b border-border transition-colors hover:bg-muted/30">
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {formatDate(payout.initiatedAt)}
      </td>
      <td className="px-4 py-3 text-sm font-semibold text-foreground">
        {formatGBP(payout.amountPence)}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
        >
          <Icon className="size-3" />
          {label}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {formatDate(payout.arrivedAt)}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {payout.bankLast4 ? `···· ${payout.bankLast4}` : "—"}
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Payout history mobile card
// ---------------------------------------------------------------------------

function PayoutCard(
  props: Readonly<{ payout: PayoutRecord }>,
) {
  const { payout } = props;
  const { label, className, Icon } = statusConfig(payout.status);
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            {formatGBP(payout.amountPence)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Initiated: {formatDate(payout.initiatedAt)}
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
        >
          <Icon className="size-3" />
          {label}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>Arrived: {formatDate(payout.arrivedAt)}</span>
        <span>{payout.bankLast4 ? `···· ${payout.bankLast4}` : ""}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PaymentsOverview(
  props: Readonly<{
    balance: StripeBalance;
    payouts: PayoutRecord[];
  }>,
) {
  const { balance, payouts } = props;

  return (
    <div className="space-y-6">
      {/* Balance cards */}
      <BalanceCards balance={balance} />

      {/* Payout ETA */}
      <PayoutEtaBanner balance={balance} />

      {/* Payout history */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-heading text-base font-semibold text-foreground">
            Payout History
          </h2>
          <Link
            href="/dashboard/provider/payments"
            className="flex items-center gap-1 text-xs font-medium text-brand-accent hover:underline"
            aria-label="View all payouts"
          >
            View all
            <ArrowUpRight className="size-3" />
          </Link>
        </div>

        {payouts.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No payouts yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Payouts will appear here once your balance is sufficient.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Arrival Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Account
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((payout) => (
                    <PayoutRow key={payout.id} payout={payout} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-border md:hidden">
              {payouts.map((payout) => (
                <div key={payout.id} className="p-3">
                  <PayoutCard payout={payout} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
