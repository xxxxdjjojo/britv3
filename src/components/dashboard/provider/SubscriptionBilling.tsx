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
  TrendingUp,
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

// Feature row labels (match the Plan keys we want to display)
const FEATURE_ROWS: Array<{ label: string; key: keyof Plan }> = [
  { label: "Leads per month", key: "leads" },
  { label: "Profile / Badge", key: "badge" },
  { label: "Analytics", key: "analytics" },
  { label: "Support", key: "support" },
  { label: "Boost credits", key: "boostCredits" },
];

// ---------------------------------------------------------------------------
// Demo billing history (hardcoded — would come from props in production)
// ---------------------------------------------------------------------------

const DEMO_BILLING: BillingRow[] = [
  {
    id: "inv_001",
    date: "2026-03-01",
    amount: 7900,
    status: "paid",
    invoiceUrl: "#",
  },
  {
    id: "inv_002",
    date: "2026-02-01",
    amount: 7900,
    status: "paid",
    invoiceUrl: "#",
  },
  {
    id: "inv_003",
    date: "2026-01-01",
    amount: 7900,
    status: "paid",
    invoiceUrl: "#",
  },
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
// Earnings metric cards (Stitch design: available + pending + tax)
// ---------------------------------------------------------------------------

function EarningsMetrics() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* Available to withdraw — hero card */}
      <div className="rounded-xl bg-brand-primary p-6 text-white">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-white/70" />
          <p className="font-body text-sm font-medium text-white/70">
            Available to Withdraw
          </p>
        </div>
        <p className="mt-2 font-heading text-3xl font-bold">£12,450.80</p>
        <p className="mt-1 font-body text-xs uppercase tracking-wide text-white/60">
          Ready · Stripe Connect
        </p>
      </div>

      {/* Pending payments */}
      <div className="rounded-xl bg-card p-6 shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
        <p className="font-body text-sm font-medium text-muted-foreground">
          Pending Payments
        </p>
        <p className="mt-2 font-heading text-3xl font-bold text-foreground">
          £2,180.00
        </p>
        <p className="mt-1 font-body text-xs text-muted-foreground">4 jobs in progress</p>
      </div>

      {/* Tax estimate */}
      <div className="rounded-xl bg-card p-6 shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
        <p className="font-body text-sm font-medium text-muted-foreground">
          Tax Estimate
        </p>
        <p className="mt-2 font-heading text-3xl font-bold text-foreground">
          £4,890.45
        </p>
        <p className="mt-1 font-body text-xs text-muted-foreground">
          At 20% effective rate
        </p>
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

  const badgeColour =
    currentPlanId === "free"
      ? "bg-muted text-muted-foreground"
      : "bg-brand-primary-lighter text-brand-primary";

  return (
    <div className="rounded-xl bg-card p-6 shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-brand-primary text-white">
            {renderPlanIcon(currentPlanId, "size-6")}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${badgeColour}`}
              >
                {plan.name} Plan
              </span>
              {currentPlanId !== "free" && (
                <span className="rounded-full bg-brand-primary-lighter px-2 py-0.5 text-xs font-medium text-brand-primary">
                  Active
                </span>
              )}
            </div>
            <p className="mt-1 font-body text-sm text-muted-foreground">
              {plan.priceMonthly !== null
                ? `£${plan.priceMonthly}/month`
                : "Free forever"}
              {renewalDate ? ` · Renews ${formatDate(renewalDate)}` : ""}
            </p>
          </div>
        </div>

        {currentPlanId !== "free" && (
          <button
            className="rounded-lg border border-destructive/30 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5"
            aria-label="Cancel subscription plan"
          >
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
    <div className="overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
      <div className="border-b border-neutral-100/60 px-6 py-4 dark:border-neutral-700/60">
        <h2 className="font-heading text-base font-semibold text-foreground">
          Choose Your Plan
        </h2>
        <p className="mt-0.5 font-body text-sm text-muted-foreground">
          Upgrade at any time. Changes take effect immediately.
        </p>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-100/60 dark:border-neutral-700/60">
              <th className="w-40 py-4 pl-6 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Feature
              </th>
              {PLANS.map((plan) => {
                const isCurrent = plan.id === currentPlanId;
                return (
                  <th
                    key={plan.id}
                    className={`px-4 py-4 text-center ${
                      isCurrent
                        ? "bg-brand-primary-lighter"
                        : plan.highlight
                          ? "bg-muted/30"
                          : ""
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      {renderPlanIcon(
                        plan.id,
                        `size-5 ${isCurrent ? "text-brand-primary" : "text-muted-foreground"}`,
                      )}
                      <span
                        className={`font-heading text-sm font-bold ${isCurrent ? "text-brand-primary" : "text-foreground"}`}
                      >
                        {plan.name}
                      </span>
                      <span className="font-body text-xs text-muted-foreground">
                        {plan.priceMonthly !== null
                          ? `£${plan.priceMonthly}/mo`
                          : "Free"}
                      </span>
                      {plan.highlight && !isCurrent && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                          Popular
                        </span>
                      )}
                      {isCurrent && (
                        <span className="rounded-full bg-brand-primary px-2 py-0.5 text-xs font-medium text-white">
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
              <tr
                key={row.key}
                className="border-b border-neutral-100/60 last:border-0 dark:border-neutral-700/60"
              >
                <td className="py-3 pl-6 pr-4 font-body text-sm font-medium text-foreground">
                  {row.label}
                </td>
                {PLANS.map((plan) => {
                  const isCurrent = plan.id === currentPlanId;
                  const value = plan[row.key];
                  return (
                    <td
                      key={plan.id}
                      className={`px-4 py-3 text-center font-body text-sm ${
                        isCurrent
                          ? "bg-brand-primary-lighter font-medium text-brand-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      {typeof value === "number" ? (
                        value === 0 ? (
                          <span className="text-muted-foreground/40">—</span>
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
            <tr className="border-t border-neutral-100/60 bg-muted/20 dark:border-neutral-700/60">
              <td className="py-4 pl-6 pr-4 font-body text-sm font-medium text-muted-foreground">
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
                    className={`px-4 py-4 text-center ${isCurrent ? "bg-brand-primary-lighter" : ""}`}
                  >
                    {isCurrent ? (
                      <span className="inline-flex items-center gap-1 font-body text-sm font-medium text-brand-primary">
                        <Check className="size-4" /> Current
                      </span>
                    ) : isDowngrade ? (
                      <button
                        onClick={() => onUpgrade(plan.id)}
                        className="rounded-lg border border-border px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                        aria-label={`Downgrade to ${plan.name}`}
                      >
                        Downgrade
                      </button>
                    ) : (
                      <button
                        onClick={() => onUpgrade(plan.id)}
                        className="rounded-lg bg-brand-primary px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-brand-primary/90"
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
      <div className="divide-y divide-neutral-100/60 dark:divide-neutral-700/60 md:hidden">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          const isDowngrade =
            PLANS.findIndex((p) => p.id === plan.id) <
            PLANS.findIndex((p) => p.id === currentPlanId);

          return (
            <div
              key={plan.id}
              className={`p-5 ${isCurrent ? "border-l-4 border-brand-primary bg-brand-primary-lighter" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {renderPlanIcon(
                    plan.id,
                    `size-5 ${isCurrent ? "text-brand-primary" : "text-muted-foreground"}`,
                  )}
                  <div>
                    <p
                      className={`font-heading text-sm font-bold ${isCurrent ? "text-brand-primary" : "text-foreground"}`}
                    >
                      {plan.name}
                    </p>
                    <p className="font-body text-xs text-muted-foreground">
                      {plan.priceMonthly !== null
                        ? `£${plan.priceMonthly}/mo`
                        : "Free"}
                    </p>
                  </div>
                </div>
                {isCurrent ? (
                  <span className="rounded-full bg-brand-primary px-2 py-0.5 text-xs font-medium text-white">
                    Current
                  </span>
                ) : isDowngrade ? (
                  <button
                    onClick={() => onUpgrade(plan.id)}
                    className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-foreground"
                    aria-label={`Downgrade to ${plan.name}`}
                  >
                    Downgrade
                  </button>
                ) : (
                  <button
                    onClick={() => onUpgrade(plan.id)}
                    className="rounded-lg bg-brand-primary px-3 py-1 text-xs font-semibold text-white hover:bg-brand-primary/90"
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
                    <li
                      key={row.key}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="font-body text-muted-foreground">{row.label}</span>
                      <span
                        className={`font-body font-medium ${isCurrent ? "text-brand-primary" : "text-foreground"}`}
                      >
                        {typeof value === "number"
                          ? value === 0
                            ? "—"
                            : String(value)
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

function PaymentMethodSection(
  props: Readonly<{ stripeEnabled: boolean }>,
) {
  const { stripeEnabled } = props;

  if (!stripeEnabled) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6">
        <div className="flex items-center gap-3">
          <CreditCard className="size-5 text-muted-foreground" />
          <div>
            <p className="font-body text-sm font-medium text-foreground">
              Payment Method
            </p>
            <p className="mt-0.5 font-body text-xs text-muted-foreground">
              Stripe billing is not yet configured. Check back soon.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card p-6 shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
      <h2 className="font-heading text-base font-semibold text-foreground">
        Payment Method
      </h2>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Card artwork */}
          <div className="flex size-12 items-center justify-center rounded-lg border border-border bg-muted">
            <CreditCard className="size-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-body text-sm font-medium text-foreground">
              Visa ending in{" "}
              <span className="font-bold tracking-widest">4242</span>
            </p>
            <p className="mt-0.5 font-body text-xs text-muted-foreground">
              Expires 12 / 2028
            </p>
          </div>
        </div>
        <button
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          aria-label="Update payment method"
        >
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

function billingStatusConfig(status: BillingStatus): string {
  switch (status) {
    case "paid":
      return "bg-brand-primary-lighter text-brand-primary dark:bg-brand-primary/20 dark:text-green-300";
    case "pending":
      return "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
    case "failed":
      return "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300";
  }
}

function BillingHistorySection(
  props: Readonly<{ rows: BillingRow[] }>,
) {
  const { rows } = props;

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
      <div className="border-b border-neutral-100/60 px-6 py-4 dark:border-neutral-700/60">
        <h2 className="font-heading text-base font-semibold text-foreground">
          Billing History
        </h2>
      </div>

      {rows.length === 0 ? (
        <div className="py-12 text-center">
          <p className="font-body text-sm text-muted-foreground">
            No billing history yet.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100/60 bg-muted/40 dark:border-neutral-700/60">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Invoice
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-neutral-100/60 last:border-0 transition-colors hover:bg-muted/30 dark:border-neutral-700/60"
                >
                  <td className="px-6 py-3 font-body text-sm text-muted-foreground">
                    {formatDate(row.date)}
                  </td>
                  <td className="px-4 py-3 font-body text-sm font-semibold text-foreground">
                    {formatGBP(row.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${billingStatusConfig(row.status)}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {row.invoiceUrl ? (
                      <a
                        href={row.invoiceUrl}
                        className="inline-flex items-center gap-1 font-body text-xs font-medium text-brand-accent hover:underline"
                        aria-label={`Download invoice for ${formatDate(row.date)}`}
                      >
                        <Download className="size-3" />
                        Download
                      </a>
                    ) : (
                      <span className="font-body text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
  const {
    currentPlanId = "free",
    renewalDate = null,
    stripeEnabled,
  } = props;

  const [activePlan, setActivePlan] = useState<PlanId>(currentPlanId);

  function handleUpgrade(planId: PlanId) {
    // Placeholder — in production this would open the Stripe billing portal
    // or initiate a Stripe Checkout session.
    setActivePlan(planId);
  }

  return (
    <div className="space-y-8">
      {/* 0. Earnings metrics (Stitch: available + pending + tax) */}
      <EarningsMetrics />

      {/* 1. Current plan banner */}
      <CurrentPlanBanner
        currentPlanId={activePlan}
        renewalDate={renewalDate}
      />

      {/* 2. Plan comparison table */}
      <PlanComparisonTable
        currentPlanId={activePlan}
        onUpgrade={handleUpgrade}
      />

      {/* 3. Payment method */}
      <PaymentMethodSection stripeEnabled={stripeEnabled} />

      {/* 4. Billing history */}
      <BillingHistorySection rows={DEMO_BILLING} />
    </div>
  );
}
