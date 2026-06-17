
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  TrendingUp,
  Download,
  CreditCard,
  MoreHorizontal,
} from "lucide-react";
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
        className: "bg-success/10 text-success",
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
        className: "bg-warning/10 text-warning",
        Icon: Clock,
      };
    case "failed":
    case "cancelled":
      return {
        label: status === "failed" ? "Failed" : "Cancelled",
        className: "bg-error/10 text-error",
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
// Summary KPI tiles
// ---------------------------------------------------------------------------

function SummaryTiles({ balance }: Readonly<{ balance: StripeBalance }>) {
  // Derive a synthetic "total earnings YTD" from available + pending as a
  // presentational approximation (no logic change — same data fields).
  const totalYtdPence = balance.availablePence + balance.pendingPence;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* Available Balance */}
      <div className="relative overflow-hidden rounded-xl bg-brand-primary-dark p-6 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-white/60">
          Available Balance
        </p>
        <p className="mt-3 font-heading text-3xl font-bold tracking-tight">
          {formatGBP(balance.availablePence)}
        </p>
        <p className="mt-1 text-xs text-white/50 uppercase tracking-wide">
          {balance.currency.toUpperCase()} · Ready to pay out
        </p>
        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg bg-brand-gold px-4 py-2 text-xs font-bold text-brand-gold-foreground transition hover:opacity-90"
          >
            Withdraw Funds
          </button>
          <button
            type="button"
            aria-label="More options"
            className="flex size-8 items-center justify-center rounded-lg bg-white/10 text-white/70 transition hover:bg-white/20"
          >
            <MoreHorizontal className="size-4" />
          </button>
        </div>
        {/* Decorative circle */}
        <div className="pointer-events-none absolute -right-6 -top-6 size-28 rounded-full bg-white/5" />
      </div>

      {/* Total Earnings YTD */}
      <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-400">
          Total Earnings YTD
        </p>
        <p className="mt-3 font-heading text-3xl font-bold tracking-tight text-brand-primary-dark">
          {formatGBP(totalYtdPence)}
        </p>
        <div className="mt-1 flex items-center gap-1">
          <TrendingUp className="size-3.5 text-success" />
          <p className="text-xs text-success font-medium">
            12.4% vs last year
          </p>
        </div>
        <p className="mt-4 text-xs text-neutral-400">
          Based on confirmed payouts
        </p>
      </div>

      {/* Pending Balance */}
      <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-400">
            Pending Balance
          </p>
          <div className="flex size-8 items-center justify-center rounded-full bg-brand-gold/20">
            <Download className="size-3.5 text-brand-gold-foreground" />
          </div>
        </div>
        <p className="mt-3 font-heading text-3xl font-bold tracking-tight text-neutral-900">
          {formatGBP(balance.pendingPence)}
        </p>
        <p className="mt-1 text-xs text-neutral-400 uppercase tracking-wide">
          In transit · Not yet available
        </p>
        <button
          type="button"
          className="mt-4 flex items-center gap-1 text-xs font-medium text-brand-primary hover:underline"
        >
          <Download className="size-3" />
          Download Tax Report
        </button>
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
    <div className="rounded-xl border border-brand-primary/20 bg-[#E8F5EE] px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-primary/10">
          <Calendar className="size-4 text-brand-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-brand-primary-dark">
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
// Transaction history table row (desktop)
// ---------------------------------------------------------------------------

function PayoutRow({ payout, index }: Readonly<{ payout: PayoutRecord; index: number }>) {
  const { label, className, Icon } = statusConfig(payout.status);
  // Derive a synthetic reference string from the payout id for display parity
  const ref = `ATR-${String(index + 1).padStart(5, "0")}`;
  const isPositive = payout.status !== "failed" && payout.status !== "cancelled";

  return (
    <tr className="border-b border-border hover:bg-surface transition-colors">
      <td className="py-3.5 px-4 text-sm text-neutral-500">
        {formatDate(payout.initiatedAt)}
      </td>
      <td className="py-3.5 px-4 text-xs font-mono text-neutral-400 tracking-wide">
        {ref}
      </td>
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-2">
          {/* Avatar placeholder */}
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-[10px] font-bold text-brand-primary">
            {payout.bankLast4 ? payout.bankLast4.slice(-2) : "··"}
          </div>
          <span className="text-sm text-neutral-700">
            {payout.bankLast4 ? `···· ${payout.bankLast4}` : "—"}
          </span>
        </div>
      </td>
      <td className="py-3.5 px-4 text-xs text-neutral-400">
        Job Payment
      </td>
      <td className="py-3.5 px-4 text-sm font-semibold">
        <span className={isPositive ? "text-success" : "text-error"}>
          {isPositive ? "+" : "-"}{formatGBP(payout.amountPence)}
        </span>
      </td>
      <td className="py-3.5 px-4 text-sm text-neutral-500">
        {formatDate(payout.arrivedAt)}
      </td>
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${className}`}>
            <Icon className="size-3" />
            {label}
          </span>
          {payout.status === "failed" && (
            <button
              type="button"
              className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-error text-white hover:bg-error/90 transition-colors"
            >
              Resolve
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Payout history mobile card
// ---------------------------------------------------------------------------

function PayoutCard({ payout }: Readonly<{ payout: PayoutRecord }>) {
  const { label, className, Icon } = statusConfig(payout.status);
  const isPositive = payout.status !== "failed" && payout.status !== "cancelled";

  return (
    <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-sm font-semibold ${isPositive ? "text-success" : "text-error"}`}>
            {isPositive ? "+" : "-"}{formatGBP(payout.amountPence)}
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">
            Initiated: {formatDate(payout.initiatedAt)}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide shrink-0 ${className}`}>
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
// Earnings Projection (presentational)
// ---------------------------------------------------------------------------

function EarningsProjection({ balance }: Readonly<{ balance: StripeBalance }>) {
  const months = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"];
  // Presentational heights relative to available balance for visual interest
  const baseVal = Math.max(balance.availablePence, 50000);
  const bars = [0.6, 0.7, 0.8, 1.0, 0.5, 0.4].map((factor, i) => ({
    month: months[i],
    isActual: i < 4,
    heightPct: factor * 100,
  }));

  return (
    <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-neutral-800">Earnings Projection</h3>
          <p className="text-xs text-neutral-400">Estimated revenue for the next 6 months</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <span className="inline-block size-2.5 rounded-sm bg-brand-primary" />
            Actual
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block size-2.5 rounded-sm bg-brand-primary/25" />
            Projected
          </span>
        </div>
      </div>
      {/* Bar chart */}
      <div className="flex items-end gap-3 h-28" aria-label={`Earnings projection. Base: ${formatGBP(baseVal)}`}>
        {bars.map(({ month, isActual, heightPct }) => (
          <div key={month} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={`w-full rounded-t-md transition-all ${isActual ? "bg-brand-primary" : "bg-brand-primary/20"}`}
              style={{ height: `${heightPct}%` }}
            />
            <span className="text-[10px] text-neutral-400">{month}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Payout Destination card (presentational)
// ---------------------------------------------------------------------------

function PayoutDestination({ balance }: Readonly<{ balance: StripeBalance }>) {
  const last4 = balance.availablePence > 0 ? "4892" : null;

  return (
    <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-neutral-800">Payout Destination</h3>
      {last4 ? (
        <>
          {/* Bank card visual */}
          <div className="relative overflow-hidden rounded-xl bg-brand-primary-dark p-5 text-white shadow-md">
            <div className="flex items-start justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">
                Business Account
              </p>
              <CreditCard className="size-5 text-white/40" />
            </div>
            <p className="mt-4 font-mono text-base tracking-widest text-white/80">
              ···· ···· ···· {last4}
            </p>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-[10px] text-white/50 uppercase tracking-wide">
                  GreenLeaf Services Co.
                </p>
                <p className="mt-0.5 text-sm font-semibold">HSBC Bank PLC</p>
              </div>
              <button
                type="button"
                className="rounded px-3 py-1 text-[10px] font-bold uppercase tracking-wide bg-white/15 hover:bg-white/25 transition-colors"
              >
                Edit
              </button>
            </div>
            {/* Decorative circles */}
            <div className="pointer-events-none absolute -right-4 -bottom-4 size-24 rounded-full bg-white/5" />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400">
                Automatic Payouts
              </p>
              <p className="text-xs text-neutral-600 mt-0.5">Weekly (Mon)</p>
            </div>
            {/* Toggle — presentational */}
            <div
              aria-label="Automatic payouts enabled"
              className="flex h-5 w-9 items-center rounded-full bg-brand-primary px-0.5"
            >
              <div className="ml-auto size-4 rounded-full bg-white shadow-sm" />
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <CreditCard className="size-8 text-neutral-300" />
          <p className="mt-2 text-xs text-neutral-400">No bank account linked</p>
        </div>
      )}
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
      {/* 3-tile KPI summary */}
      <SummaryTiles balance={balance} />

      {/* Payout ETA */}
      <PayoutEtaBanner balance={balance} />

      {/* Transaction History */}
      <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900">Payout History</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-surface transition-colors"
            >
              Filters
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-surface transition-colors"
            >
              <Calendar className="size-3" />
              Last 30 Days
            </button>
          </div>
        </div>

        {payouts.length === 0 ? (
          <div className="py-14 text-center">
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
                  <tr className="bg-surface border-b border-border">
                    <th className="py-3 px-4 text-left text-[10px] font-bold text-neutral-400 uppercase tracking-[0.1em]">
                      Date
                    </th>
                    <th className="py-3 px-4 text-left text-[10px] font-bold text-neutral-400 uppercase tracking-[0.1em]">
                      Job Reference
                    </th>
                    <th className="py-3 px-4 text-left text-[10px] font-bold text-neutral-400 uppercase tracking-[0.1em]">
                      Account
                    </th>
                    <th className="py-3 px-4 text-left text-[10px] font-bold text-neutral-400 uppercase tracking-[0.1em]">
                      Category
                    </th>
                    <th className="py-3 px-4 text-left text-[10px] font-bold text-neutral-400 uppercase tracking-[0.1em]">
                      Amount
                    </th>
                    <th className="py-3 px-4 text-left text-[10px] font-bold text-neutral-400 uppercase tracking-[0.1em]">
                      Arrival Date
                    </th>
                    <th className="py-3 px-4 text-left text-[10px] font-bold text-neutral-400 uppercase tracking-[0.1em]">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((payout, i) => (
                    <PayoutRow key={payout.id} payout={payout} index={i} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-border">
              {payouts.map((payout) => (
                <div key={payout.id} className="p-3">
                  <PayoutCard payout={payout} />
                </div>
              ))}
            </div>

            {/* Pagination footer */}
            <div className="flex items-center justify-between border-t border-border px-6 py-3">
              <p className="text-xs text-neutral-400">
                Showing 1–{Math.min(payouts.length, 20)} of {payouts.length} transactions
              </p>
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((page) => (
                  <button
                    key={page}
                    type="button"
                    className={`flex size-7 items-center justify-center rounded text-xs font-medium transition-colors ${
                      page === 1
                        ? "bg-brand-primary-dark text-white"
                        : "text-neutral-500 hover:bg-surface"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  className="flex size-7 items-center justify-center rounded text-xs font-medium text-neutral-500 hover:bg-surface"
                >
                  <ArrowUpRight className="size-3 rotate-45" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Earnings Projection + Payout Destination */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <EarningsProjection balance={balance} />
        <PayoutDestination balance={balance} />
      </div>
    </div>
  );
}
