
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

function statusConfig(status: string): { label: string; className: string; Icon: React.ElementType } {
  switch (status as PayoutStatus) {
    case "paid":
      return {
        label: "Paid",
        className: "bg-green-100 text-green-700",
        Icon: CheckCircle2,
      };
    case "in_transit":
      return {
        label: "In Transit",
        className: "bg-blue-100 text-blue-700",
        Icon: Clock,
      };
    case "pending":
      return {
        label: "Pending",
        className: "bg-amber-100 text-amber-700",
        Icon: Clock,
      };
    case "failed":
    case "cancelled":
      return {
        label: status === "failed" ? "Failed" : "Cancelled",
        className: "bg-red-100 text-red-700",
        Icon: XCircle,
      };
    default:
      return {
        label: status,
        className: "bg-neutral-100 text-neutral-600",
        Icon: Clock,
      };
  }
}

// ---------------------------------------------------------------------------
// Balance cards
// ---------------------------------------------------------------------------

function BalanceCards({ balance }: Readonly<{ balance: StripeBalance }>) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* Available */}
      <div className="rounded-xl bg-brand-primary p-6 text-white">
        <p className="text-sm font-medium text-white/70">Available Balance</p>
        <p className="mt-2 text-3xl font-bold">
          {formatGBP(balance.availablePence)}
        </p>
        <p className="mt-1 text-xs text-white/60 uppercase tracking-wide">
          {balance.currency.toUpperCase()} · Ready to pay out
        </p>
      </div>

      {/* Pending */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-neutral-500">Pending Balance</p>
        <p className="mt-2 text-3xl font-bold text-neutral-900">
          {formatGBP(balance.pendingPence)}
        </p>
        <p className="mt-1 text-xs text-neutral-400 uppercase tracking-wide">
          In transit · Not yet available
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Payout ETA banner
// ---------------------------------------------------------------------------

function PayoutEtaBanner({ balance }: Readonly<{ balance: StripeBalance }>) {
  if (!balance.nextPayoutDate || balance.nextPayoutAmountPence === null) {
    return null;
  }

  return (
    <div className="rounded-lg bg-[#E8F5EE] border-l-4 border-brand-primary px-5 py-4">
      <div className="flex items-center gap-3">
        <Calendar className="size-5 shrink-0 text-brand-primary" />
        <div>
          <p className="text-sm font-semibold text-brand-primary">
            Next payout:{" "}
            <span className="font-bold">{formatGBP(balance.nextPayoutAmountPence)}</span>
            {" "}arriving{" "}
            <span className="font-bold">{formatPayoutDate(balance.nextPayoutDate)}</span>
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

function PayoutRow({ payout }: Readonly<{ payout: PayoutRecord }>) {
  const { label, className, Icon } = statusConfig(payout.status);
  return (
    <tr className="border-b border-neutral-100 hover:bg-surface transition">
      <td className="py-3 px-4 text-sm text-neutral-600">
        {formatDate(payout.initiatedAt)}
      </td>
      <td className="py-3 px-4 text-sm font-medium text-neutral-900">
        {formatGBP(payout.amountPence)}
      </td>
      <td className="py-3 px-4">
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
          <Icon className="size-3" />
          {label}
        </span>
      </td>
      <td className="py-3 px-4 text-sm text-neutral-500">
        {formatDate(payout.arrivedAt)}
      </td>
      <td className="py-3 px-4 text-sm text-neutral-400">
        {payout.bankLast4 ? `···· ${payout.bankLast4}` : "—"}
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Payout history mobile card
// ---------------------------------------------------------------------------

function PayoutCard({ payout }: Readonly<{ payout: PayoutRecord }>) {
  const { label, className, Icon } = statusConfig(payout.status);
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-neutral-900">
            {formatGBP(payout.amountPence)}
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">
            Initiated: {formatDate(payout.initiatedAt)}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0 ${className}`}>
          <Icon className="size-3" />
          {label}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-neutral-400">
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
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900">Payout History</h2>
          <Link
            href="/dashboard/provider/payments"
            className="text-xs font-medium text-brand-primary hover:underline flex items-center gap-1"
          >
            View all
            <ArrowUpRight className="size-3" />
          </Link>
        </div>

        {payouts.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-neutral-500">No payouts yet</p>
            <p className="mt-1 text-xs text-neutral-400">
              Payouts will appear here once your balance is sufficient.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface border-b border-neutral-200">
                    <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                      Date
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                      Amount
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                      Arrival Date
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
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
            <div className="md:hidden divide-y divide-neutral-100">
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
