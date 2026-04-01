"use client";

import { useState } from "react";
import {
  Crown,
  CreditCard,
  Download,
  Check,
  Zap,
  Star,
  Shield,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PlanId = "free" | "starter" | "professional" | "premium";

type Plan = {
  id: PlanId;
  name: string;
  priceMonthly: number | null;
  leads: string;
  badge: string;
  analytics: string;
  support: string;
  boostCredits: number;
  highlight?: boolean;
};

type BillingRow = {
  id: string;
  date: string;
  amount: number;
  status: "paid" | "pending" | "failed";
  invoiceUrl: string | null;
};

// ---------------------------------------------------------------------------
// Static plan data
// ---------------------------------------------------------------------------

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    priceMonthly: null,
    leads: "5 leads/month",
    badge: "Basic profile",
    analytics: "No analytics",
    support: "Community",
    boostCredits: 0,
  },
  {
    id: "starter",
    name: "Starter",
    priceMonthly: 29,
    leads: "25 leads/month",
    badge: "Standard profile",
    analytics: "Basic analytics",
    support: "Email",
    boostCredits: 0,
  },
  {
    id: "professional",
    name: "Professional",
    priceMonthly: 79,
    leads: "100 leads/month",
    badge: "Verified badge priority",
    analytics: "Full analytics",
    support: "Priority email",
    boostCredits: 2,
    highlight: true,
  },
  {
    id: "premium",
    name: "Premium",
    priceMonthly: 149,
    leads: "Unlimited leads",
    badge: "Top placement",
    analytics: "Full analytics",
    support: "Priority support",
    boostCredits: 5,
  },
];

const FEATURE_ROWS: Array<{ label: string; key: keyof Plan }> = [
  { label: "Leads per month", key: "leads" },
  { label: "Profile / Badge", key: "badge" },
  { label: "Analytics", key: "analytics" },
  { label: "Support", key: "support" },
  { label: "Boost credits", key: "boostCredits" },
];

const DEMO_BILLING: BillingRow[] = [
  { id: "inv_001", date: "2026-03-01", amount: 7900, status: "paid", invoiceUrl: "#" },
  { id: "inv_002", date: "2026-02-01", amount: 7900, status: "paid", invoiceUrl: "#" },
  { id: "inv_003", date: "2026-01-01", amount: 7900, status: "paid", invoiceUrl: "#" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatGBP(pence: number): string {
  return `£${(pence / 100).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function renderPlanIcon(id: PlanId, className: string) {
  switch (id) {
    case "premium":
      return <Crown className={className} />;
    case "professional":
      return <Star className={className} />;
    case "starter":
      return <Zap className={className} />;
    default:
      return <Shield className={className} />;
  }
}

// ---------------------------------------------------------------------------
// Bento Financial Overview (top grid)
// ---------------------------------------------------------------------------

function FinancialBento() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5 mb-8">
      {/* Large featured card — Available to Withdraw */}
      <div className="md:col-span-2 lg:col-span-2 bg-white p-8 rounded-2xl border border-border shadow-sm relative overflow-hidden flex flex-col justify-between">
        <div className="relative z-10">
          <span className="text-emerald-900 text-xs font-bold uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-lg">
            Available to Withdraw
          </span>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-5xl font-extrabold text-foreground tracking-tighter">
              £12,450.80
            </span>
            <span className="text-emerald-600 font-bold flex items-center text-sm">
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
                  d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941"
                />
              </svg>
              12%
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-2">
            Next auto-payout: June 15th, 2024
          </p>
        </div>
        <div className="mt-8 flex items-center gap-4 relative z-10">
          <button className="flex-1 py-3 bg-brand-primary-dark text-white rounded-xl font-bold hover:bg-brand-primary transition-all shadow-lg active:scale-95 text-sm">
            Withdraw Now
          </button>
          <button className="p-3 bg-muted border border-border rounded-xl hover:bg-muted/80 transition-colors">
            <svg
              className="size-5 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"
              />
            </svg>
          </button>
        </div>
        {/* Decorative background element */}
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-emerald-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
      </div>

      {/* Pending Payments */}
      <div className="bg-white p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
        <div>
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 mb-4">
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
          <p className="text-muted-foreground text-sm font-medium">Pending Payments</p>
          <h3 className="text-2xl font-bold text-foreground mt-1">£2,180.00</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-4">4 jobs currently in processing</p>
      </div>

      {/* Tax Estimate */}
      <div className="bg-white p-6 rounded-2xl border border-border shadow-sm flex flex-col justify-between">
        <div>
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-4">
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
          <p className="text-muted-foreground text-sm font-medium">Tax Estimate (YTD)</p>
          <h3 className="text-2xl font-bold text-foreground mt-1">£4,890.45</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-4">Calculated at 20% effective rate</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Monthly Revenue chart + Payout Method
// ---------------------------------------------------------------------------

const REVENUE_BARS = [
  { label: "JAN", heightPct: 40, bold: false },
  { label: "FEB", heightPct: 65, bold: false },
  { label: "MAR", heightPct: 55, bold: false },
  { label: "APR", heightPct: 85, bold: true },
  { label: "MAY", heightPct: 70, bold: false },
  { label: "JUN", heightPct: 95, bold: true, dark: true },
];

function RevenueAndPayoutSection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
      {/* Revenue chart */}
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center justify-between mb-7">
          <div>
            <h3 className="font-bold text-lg font-heading text-foreground">
              Monthly Revenue
            </h3>
            <p className="text-sm text-muted-foreground">
              Earnings performance over the last 6 months
            </p>
          </div>
          <select className="text-sm border-border rounded-lg py-1 pl-3 pr-8 focus:ring-brand-primary-dark text-foreground bg-white border">
            <option>Last 6 Months</option>
            <option>Last Year</option>
          </select>
        </div>
        <div className="h-64 flex items-end justify-between gap-4 px-2">
          {REVENUE_BARS.map((bar) => (
            <div
              key={bar.label}
              className="flex-1 flex flex-col items-center gap-2 group"
            >
              <div
                className={`w-full rounded-t-lg transition-all ${
                  bar.dark
                    ? "bg-brand-primary-dark group-hover:bg-brand-primary"
                    : bar.bold
                      ? "bg-emerald-200 group-hover:bg-emerald-300"
                      : "bg-emerald-100 group-hover:bg-emerald-200"
                }`}
                style={{ height: `${bar.heightPct}%` }}
              />
              <span
                className={`text-[10px] font-medium ${
                  bar.dark || bar.bold ? "text-foreground font-bold" : "text-muted-foreground"
                }`}
              >
                {bar.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Payout Method — dark card */}
      <div className="bg-brand-primary-dark text-white p-6 rounded-2xl shadow-xl flex flex-col">
        <h3 className="font-bold text-lg mb-5 font-heading">Payout Method</h3>
        <div className="bg-white/10 border border-white/20 rounded-xl p-4 mb-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-emerald-200 uppercase tracking-widest font-bold">
              Linked Bank Account
            </span>
            <svg
              className="size-5 text-emerald-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z"
              />
            </svg>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-8 bg-white rounded flex items-center justify-center">
              <span className="text-[10px] font-bold text-brand-primary-dark">HSBC</span>
            </div>
            <div>
              <p className="font-bold text-sm">•••• •••• 4492</p>
              <p className="text-xs text-emerald-200">Business Direct Account</p>
            </div>
          </div>
        </div>
        <div className="space-y-3 mb-5">
          <div className="flex justify-between text-sm">
            <span className="text-emerald-200">Processing Fee</span>
            <span className="font-medium">£0.00 (Standard)</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-emerald-200">Arrival Time</span>
            <span className="font-medium">1-3 Business Days</span>
          </div>
        </div>
        <button className="mt-auto w-full py-3.5 bg-white text-brand-primary-dark rounded-xl font-extrabold hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 text-sm">
          Change Account
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
  );
}

// ---------------------------------------------------------------------------
// Current Plan Banner
// ---------------------------------------------------------------------------

function CurrentPlanBanner(
  props: Readonly<{ currentPlanId: PlanId; renewalDate: string | null }>,
) {
  const { currentPlanId, renewalDate } = props;
  const plan = PLANS.find((p) => p.id === currentPlanId) ?? PLANS[0];

  return (
    <div className="bg-white p-6 rounded-2xl border border-border shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-brand-primary-dark text-white">
            {renderPlanIcon(currentPlanId, "size-6")}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold bg-emerald-50 text-emerald-900">
                {plan.name} Plan
              </span>
              {currentPlanId !== "free" && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                  Active
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {plan.priceMonthly !== null
                ? `£${plan.priceMonthly}/month`
                : "Free forever"}
              {renewalDate ? ` · Renews ${formatDate(renewalDate)}` : ""}
            </p>
          </div>
        </div>

        {currentPlanId !== "free" && (
          <button className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50">
            Cancel Plan
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Plan comparison table
// ---------------------------------------------------------------------------

function PlanComparisonTable(
  props: Readonly<{
    currentPlanId: PlanId;
    onUpgrade: (planId: PlanId) => void;
  }>,
) {
  const { currentPlanId, onUpgrade } = props;

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-border">
      <div className="border-b border-border px-6 py-4">
        <h2 className="font-heading text-base font-semibold text-foreground">
          Choose Your Plan
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Upgrade at any time. Changes take effect immediately.
        </p>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="w-40 py-4 pl-6 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Feature
              </th>
              {PLANS.map((plan) => {
                const isCurrent = plan.id === currentPlanId;
                return (
                  <th
                    key={plan.id}
                    className={`px-4 py-4 text-center ${
                      isCurrent ? "bg-emerald-50" : plan.highlight ? "bg-muted/50" : ""
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      {renderPlanIcon(
                        plan.id,
                        `size-5 ${isCurrent ? "text-brand-primary-dark" : "text-muted-foreground"}`,
                      )}
                      <span
                        className={`font-heading text-sm font-bold ${isCurrent ? "text-brand-primary-dark" : "text-foreground"}`}
                      >
                        {plan.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {plan.priceMonthly !== null
                          ? `£${plan.priceMonthly}/mo`
                          : "Free"}
                      </span>
                      {plan.highlight && !isCurrent && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          Popular
                        </span>
                      )}
                      {isCurrent && (
                        <span className="rounded-full bg-brand-primary-dark px-2 py-0.5 text-xs font-medium text-white">
                          Current
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {FEATURE_ROWS.map((row) => (
              <tr key={row.key} className="border-b border-border last:border-0">
                <td className="py-3 pl-6 pr-4 text-sm font-medium text-foreground">
                  {row.label}
                </td>
                {PLANS.map((plan) => {
                  const isCurrent = plan.id === currentPlanId;
                  const value = plan[row.key];
                  return (
                    <td
                      key={plan.id}
                      className={`px-4 py-3 text-center text-sm ${
                        isCurrent
                          ? "bg-emerald-50 font-medium text-brand-primary-dark"
                          : "text-muted-foreground"
                      }`}
                    >
                      {typeof value === "number" ? (
                        value === 0 ? (
                          <span className="text-muted-foreground/50">—</span>
                        ) : (
                          <span className="font-semibold">{value}</span>
                        )
                      ) : (
                        String(value)
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* CTA row */}
            <tr className="border-t border-border bg-muted/50">
              <td className="py-4 pl-6 pr-4 text-sm font-medium text-muted-foreground">
                Action
              </td>
              {PLANS.map((plan) => {
                const isCurrent = plan.id === currentPlanId;
                const isDowngrade =
                  PLANS.findIndex((p) => p.id === plan.id) <
                  PLANS.findIndex((p) => p.id === currentPlanId);

                return (
                  <td
                    key={plan.id}
                    className={`px-4 py-4 text-center ${isCurrent ? "bg-emerald-50" : ""}`}
                  >
                    {isCurrent ? (
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary-dark">
                        <Check className="size-4" /> Current
                      </span>
                    ) : isDowngrade ? (
                      <button
                        onClick={() => onUpgrade(plan.id)}
                        className="rounded-xl border border-border px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
                        aria-label={`Downgrade to ${plan.name}`}
                      >
                        Downgrade
                      </button>
                    ) : (
                      <button
                        onClick={() => onUpgrade(plan.id)}
                        className="rounded-xl bg-brand-primary-dark px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-brand-primary"
                        aria-label={`Upgrade to ${plan.name}`}
                      >
                        Upgrade
                      </button>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Mobile plan cards */}
      <div className="divide-y divide-border md:hidden">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          const isDowngrade =
            PLANS.findIndex((p) => p.id === plan.id) <
            PLANS.findIndex((p) => p.id === currentPlanId);

          return (
            <div
              key={plan.id}
              className={`p-5 ${isCurrent ? "border-l-4 border-brand-primary-dark bg-emerald-50" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {renderPlanIcon(
                    plan.id,
                    `size-5 ${isCurrent ? "text-brand-primary-dark" : "text-muted-foreground"}`,
                  )}
                  <div>
                    <p className={`font-heading text-sm font-bold ${isCurrent ? "text-brand-primary-dark" : "text-foreground"}`}>
                      {plan.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {plan.priceMonthly !== null ? `£${plan.priceMonthly}/mo` : "Free"}
                    </p>
                  </div>
                </div>
                {isCurrent ? (
                  <span className="rounded-full bg-brand-primary-dark px-2 py-0.5 text-xs font-medium text-white">
                    Current
                  </span>
                ) : isDowngrade ? (
                  <button
                    onClick={() => onUpgrade(plan.id)}
                    className="rounded-xl border border-border px-3 py-1 text-xs font-medium text-foreground"
                    aria-label={`Downgrade to ${plan.name}`}
                  >
                    Downgrade
                  </button>
                ) : (
                  <button
                    onClick={() => onUpgrade(plan.id)}
                    className="rounded-xl bg-brand-primary-dark px-3 py-1 text-xs font-semibold text-white hover:bg-brand-primary"
                    aria-label={`Upgrade to ${plan.name}`}
                  >
                    Upgrade
                  </button>
                )}
              </div>
              <ul className="mt-3 space-y-1.5">
                {FEATURE_ROWS.map((row) => {
                  const value = plan[row.key];
                  return (
                    <li key={row.key} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className={`font-medium ${isCurrent ? "text-brand-primary-dark" : "text-foreground"}`}>
                        {typeof value === "number"
                          ? value === 0 ? "—" : String(value)
                          : String(value)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Payment Method section
// ---------------------------------------------------------------------------

function PaymentMethodSection(props: Readonly<{ stripeEnabled: boolean }>) {
  const { stripeEnabled } = props;

  if (!stripeEnabled) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted p-6">
        <div className="flex items-center gap-3">
          <CreditCard className="size-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">
              Payment Method
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Stripe billing is not yet configured. Check back soon.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-border">
      <h2 className="font-heading text-base font-semibold text-foreground mb-4">
        Payment Method
      </h2>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl border border-border bg-muted">
            <CreditCard className="size-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Visa ending in{" "}
              <span className="font-bold tracking-widest">4242</span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Expires 12 / 2028</p>
          </div>
        </div>
        <button className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
          Update
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Billing History table
// ---------------------------------------------------------------------------

type BillingStatus = "paid" | "pending" | "failed";

function billingStatusConfig(status: BillingStatus): { pill: string; dot: string } {
  switch (status) {
    case "paid":
      return { pill: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" };
    case "pending":
      return { pill: "bg-amber-50 text-amber-700", dot: "bg-amber-500" };
    case "failed":
      return { pill: "bg-red-50 text-red-700", dot: "bg-red-500" };
  }
}

function BillingHistorySection(props: Readonly<{ rows: BillingRow[] }>) {
  const { rows } = props;

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-border">
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <h2 className="font-heading text-base font-semibold text-foreground">
          Transaction History
        </h2>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 bg-muted text-muted-foreground rounded-lg text-xs font-semibold hover:bg-muted/80 transition-colors">
            All
          </button>
          <button className="px-3 py-1.5 text-muted-foreground rounded-lg text-xs font-semibold hover:bg-muted transition-colors">
            Paid
          </button>
          <button className="px-3 py-1.5 text-muted-foreground rounded-lg text-xs font-semibold hover:bg-muted transition-colors">
            Pending
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground">No billing history yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-muted text-muted-foreground text-[10px] uppercase tracking-wider font-bold border-b border-border">
                <th className="px-6 py-4">Job ID</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => {
                const { pill, dot } = billingStatusConfig(row.status);
                return (
                  <tr key={row.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-muted-foreground">
                      #{row.id.toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                          P
                        </div>
                        <span className="text-sm font-semibold text-foreground">
                          Platform Subscription
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {formatDate(row.date)}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-foreground">
                      {formatGBP(row.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${pill}`}>
                          {row.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {row.invoiceUrl ? (
                        <a
                          href={row.invoiceUrl}
                          className="inline-flex items-center gap-1 text-xs font-medium text-brand-primary-dark hover:underline"
                          aria-label={`Download invoice for ${formatDate(row.date)}`}
                        >
                          <Download className="size-3" />
                          Download
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="p-4 border-t border-border bg-muted flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium">
          Showing {rows.length} of {rows.length} transactions
        </p>
        <div className="flex gap-2">
          <button
            disabled
            className="px-3 py-1 border border-border rounded text-xs hover:bg-white transition-colors disabled:opacity-50 text-muted-foreground"
          >
            Previous
          </button>
          <button className="px-3 py-1 border border-border rounded text-xs hover:bg-white transition-colors text-muted-foreground">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main exported component
// ---------------------------------------------------------------------------

export type SubscriptionBillingProps = Readonly<{
  currentPlanId?: PlanId;
  renewalDate?: string | null;
  stripeEnabled: boolean;
}>;

export function SubscriptionBilling(props: SubscriptionBillingProps) {
  const { currentPlanId = "free", renewalDate = null, stripeEnabled } = props;

  const [activePlan, setActivePlan] = useState<PlanId>(currentPlanId);

  function handleUpgrade(planId: PlanId) {
    // Placeholder — in production this would open the Stripe billing portal
    setActivePlan(planId);
  }

  return (
    <div className="space-y-8">
      {/* 0. Bento financial overview */}
      <FinancialBento />

      {/* 1. Revenue chart + payout method */}
      <RevenueAndPayoutSection />

      {/* 2. Transaction / billing history */}
      <BillingHistorySection rows={DEMO_BILLING} />

      {/* 3. Current plan banner */}
      <CurrentPlanBanner currentPlanId={activePlan} renewalDate={renewalDate} />

      {/* 4. Plan comparison table */}
      <PlanComparisonTable currentPlanId={activePlan} onUpgrade={handleUpgrade} />

      {/* 5. Payment method */}
      <PaymentMethodSection stripeEnabled={stripeEnabled} />
    </div>
  );
}
