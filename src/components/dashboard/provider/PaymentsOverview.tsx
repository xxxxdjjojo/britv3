
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
// Status badge helpers
// ---------------------------------------------------------------------------

type PayoutStatus = "paid" | "pending" | "in_transit" | "failed" | "cancelled";

type StatusDisplay = {
  label: string;
  dotClass: string;
  textClass: string;
};

function statusDisplay(status: string): StatusDisplay {
  switch (status as PayoutStatus) {
    case "paid":
      return {
        label: "Paid",
        dotClass: "bg-success",
        textClass: "text-success",
      };
    case "in_transit":
      return {
        label: "In Transit",
        dotClass: "bg-brand-accent",
        textClass: "text-brand-accent",
      };
    case "pending":
      return {
        label: "Processing",
        dotClass: "bg-warning",
        textClass: "text-warning",
      };
    case "failed":
      return {
        label: "Failed",
        dotClass: "bg-error",
        textClass: "text-error",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        dotClass: "bg-error/70",
        textClass: "text-error",
      };
    default:
      return {
        label: status,
        dotClass: "bg-neutral-400",
        textClass: "text-neutral-600",
      };
  }
}

// ---------------------------------------------------------------------------
// KPI Cards
// ---------------------------------------------------------------------------

function KpiCards(props: Readonly<{ balance: StripeBalance }>) {
  const { balance } = props;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* Available for Withdrawal — hero */}
      <div className="bg-white p-6 rounded-2xl border border-success/10 shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-success/70">
              Available for Withdrawal
            </p>
            <p className="text-4xl font-extrabold text-brand-primary tabular-nums">
              {formatGBP(balance.availablePence)}
            </p>
          </div>
          <div className="bg-success-light p-2.5 rounded-xl text-success">
            <svg
              className="size-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3"
              />
            </svg>
          </div>
        </div>
        <div className="mt-5 flex gap-3">
          <button className="flex-1 bg-brand-primary text-white py-2.5 rounded-xl font-semibold text-sm shadow-sm hover:bg-brand-primary-dark transition-colors active:scale-95">
            Withdraw Funds
          </button>
          <button className="px-3 border border-success/20 text-success rounded-xl hover:bg-brand-primary-lighter transition-colors">
            <svg
              className="size-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Total Earnings YTD */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Total Earnings YTD
            </p>
            <p className="text-4xl font-extrabold text-neutral-900 tabular-nums">
              {formatGBP(balance.pendingPence)}
            </p>
          </div>
          <div className="bg-neutral-100 p-2.5 rounded-xl text-neutral-600">
            <svg
              className="size-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941"
              />
            </svg>
          </div>
        </div>
        <div className="mt-5">
          <div className="flex items-center gap-2 text-success text-sm font-semibold">
            <svg
              className="size-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18"
              />
            </svg>
            <span>12.4% vs last year</span>
          </div>
          <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-tight">
            In transit · Not yet available
          </p>
        </div>
      </div>

      {/* Pending Payouts */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-secondary-dark">
              Pending Payouts
            </p>
            <p className="text-4xl font-extrabold text-neutral-900 tabular-nums">
              {balance.nextPayoutAmountPence !== null
                ? formatGBP(balance.nextPayoutAmountPence)
                : "—"}
            </p>
          </div>
          <div className="bg-brand-secondary-light p-2.5 rounded-xl text-brand-secondary-dark">
            <svg
              className="size-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </div>
        </div>
        <div className="mt-5">
          <button className="w-full border border-neutral-200 text-neutral-700 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-neutral-50 transition-colors">
            <svg
              className="size-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            Download Tax Report
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Transaction Table
// ---------------------------------------------------------------------------

function TransactionTable(props: Readonly<{ payouts: PayoutRecord[] }>) {
  const { payouts } = props;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold font-heading text-neutral-900">
          Transaction History
        </h3>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-bold text-neutral-600 flex items-center gap-2 hover:bg-neutral-50 transition-colors">
            <svg
              className="size-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12"
              />
            </svg>
            Filters
          </button>
          <button className="px-4 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-bold text-neutral-600 flex items-center gap-2 hover:bg-neutral-50 transition-colors">
            <svg
              className="size-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
              />
            </svg>
            Last 30 Days
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
        {payouts.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-neutral-500">No payouts yet</p>
            <p className="mt-1 text-xs text-neutral-400">
              Payouts will appear here once your balance is sufficient.
            </p>
          </div>
        ) : (
          <>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50/50 border-b border-neutral-100">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                    Date
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                    Job Reference
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                    Account
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                    Category
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                    Status
                  </th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {payouts.map((payout) => {
                  const { label, dotClass, textClass } = statusDisplay(
                    payout.status,
                  );
                  return (
                    <tr
                      key={payout.id}
                      className="hover:bg-neutral-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-neutral-900">
                          {formatDate(payout.initiatedAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-neutral-500">
                          #{payout.id.slice(0, 8).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-neutral-600">
                          {payout.bankLast4 ? `···· ${payout.bankLast4}` : "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-full bg-neutral-100 text-[10px] font-bold text-neutral-600">
                          Payout
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-brand-primary">
                          + {formatGBP(payout.amountPence)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`flex items-center gap-1.5 ${textClass}`}>
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${dotClass}`}
                          />
                          <span className="text-[11px] font-bold uppercase">
                            {label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-neutral-400 hover:text-neutral-900 transition-colors">
                          <svg
                            className="size-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="px-6 py-4 bg-neutral-50/50 flex items-center justify-between">
              <p className="text-xs text-neutral-500 font-medium tracking-tight">
                Showing{" "}
                <span className="font-bold text-neutral-900">{payouts.length}</span>{" "}
                transaction{payouts.length !== 1 ? "s" : ""}
              </p>
              <div className="flex gap-1">
                <button
                  disabled
                  className="p-1.5 rounded-lg border border-neutral-200 text-neutral-400 disabled:opacity-40"
                >
                  <svg
                    className="size-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 19.5 8.25 12l7.5-7.5"
                    />
                  </svg>
                </button>
                <button className="w-8 h-8 rounded-lg bg-brand-primary text-white text-xs font-bold">
                  1
                </button>
                <button className="p-1.5 rounded-lg border border-neutral-200 text-neutral-400 hover:bg-white transition-colors">
                  <svg
                    className="size-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m8.25 4.5 7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Earnings projection bar chart (static visual)
// ---------------------------------------------------------------------------

const CHART_BARS = [
  { label: "AUG", heightPct: 72, projected: false },
  { label: "SEP", heightPct: 88, projected: false },
  { label: "OCT", heightPct: 80, projected: false },
  { label: "NOV", heightPct: 96, projected: true, current: true },
  { label: "DEC", heightPct: 60, projected: true },
  { label: "JAN", heightPct: 72, projected: true, dashed: true },
];

function EarningsProjectionChart() {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-6 flex flex-col gap-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold font-heading text-neutral-900">
            Earnings Projection
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Estimated revenue for the next 3 months
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-primary" />
            <span className="text-[10px] font-bold text-neutral-600">Actual</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-primary-light/30" />
            <span className="text-[10px] font-bold text-neutral-600">Projected</span>
          </div>
        </div>
      </div>
      <div className="h-48 w-full flex items-end gap-3 px-2">
        {CHART_BARS.map((bar) => (
          <div key={bar.label} className="flex-1 space-y-2 group">
            <div
              className={`w-full rounded-t-lg relative transition-all ${
                bar.dashed
                  ? "bg-success-light/30 border-t-2 border-success/20 border-dashed"
                  : bar.projected
                    ? bar.current
                      ? "bg-brand-primary-light/30"
                      : "bg-success-light/50 border-t-2 border-success/30 border-dashed"
                    : "bg-brand-primary"
              }`}
              style={{ height: `${bar.heightPct}%` }}
            />
            <p
              className={`text-center text-[10px] font-bold ${
                bar.current ? "text-neutral-900" : "text-neutral-400"
              }`}
            >
              {bar.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Payout Destination card
// ---------------------------------------------------------------------------

function PayoutDestinationCard(props: Readonly<{ payouts: PayoutRecord[] }>) {
  const { payouts } = props;
  const lastPayout = payouts[0];

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-6 space-y-5 shadow-sm">
      <h3 className="text-base font-bold font-heading text-neutral-900">
        Payout Destination
      </h3>
      {/* Dark bank card visual */}
      <div className="bg-neutral-900 rounded-xl p-5 text-white space-y-4 shadow-lg">
        <div className="flex justify-between items-start">
          <svg
            className="size-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"
            />
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            Business account
          </span>
        </div>
        <div className="space-y-1">
          <p className="text-lg font-mono tracking-widest">
            {lastPayout?.bankLast4
              ? `**** **** **** ${lastPayout.bankLast4}`
              : "**** **** **** ****"}
          </p>
          <p className="text-[10px] uppercase font-bold text-neutral-500">
            Stripe Connect
          </p>
        </div>
        <div className="flex justify-between items-center pt-2">
          <p className="text-xs font-bold">Connected via Stripe</p>
          <button className="text-[10px] font-bold uppercase text-success/70 hover:text-success/50 transition-colors">
            Edit
          </button>
        </div>
      </div>
      {/* Auto payout toggle */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
          Automatic Payouts
        </p>
        <div className="flex items-center justify-between p-3 rounded-xl border border-neutral-100">
          <div className="flex items-center gap-3">
            <svg
              className="size-5 text-success"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
            <span className="text-xs font-bold text-neutral-800">
              Weekly (Mon)
            </span>
          </div>
          {/* Toggle pill */}
          <div className="w-8 h-4 bg-success rounded-full relative">
            <span className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm" />
          </div>
        </div>
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
    <div className="space-y-8">
      {/* KPI cards */}
      <KpiCards balance={balance} />

      {/* Next payout ETA banner */}
      {balance.nextPayoutDate && balance.nextPayoutAmountPence !== null && (
        <div className="rounded-lg border-l-4 border-brand-primary bg-brand-primary-lighter px-5 py-4 flex items-center gap-3">
          <svg
            className="size-5 shrink-0 text-brand-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
            />
          </svg>
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
      )}

      {/* Transaction history */}
      <TransactionTable payouts={payouts} />

      {/* Earnings chart + Payout destination */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <EarningsProjectionChart />
        </div>
        <div>
          <PayoutDestinationCard payouts={payouts} />
        </div>
      </div>
    </div>
  );
}
