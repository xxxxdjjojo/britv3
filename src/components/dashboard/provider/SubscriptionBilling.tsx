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

function getPlanIcon(id: PlanId) {
  switch (id) {
    case "premium":
      return Crown;
    case "professional":
      return Star;
    case "starter":
      return Zap;
    default:
      return Shield;
  }
}

// ---------------------------------------------------------------------------
// Current Plan Banner
// ---------------------------------------------------------------------------

function CurrentPlanBanner(
  props: Readonly<{ currentPlanId: PlanId; renewalDate: string | null }>,
) {
  const { currentPlanId, renewalDate } = props;
  const plan = PLANS.find((p) => p.id === currentPlanId) ?? PLANS[0];
  const Icon = getPlanIcon(currentPlanId);

  const badgeColour =
    currentPlanId === "free"
      ? "bg-neutral-100 text-neutral-600"
      : "bg-[#E8F5EE] text-[#1B4D3E]";

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-[#1B4D3E] text-white">
            <Icon className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${badgeColour}`}
              >
                {plan.name} Plan
              </span>
              {currentPlanId !== "free" && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  Active
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-neutral-500">
              {plan.priceMonthly !== null
                ? `£${plan.priceMonthly}/month`
                : "Free forever"}
              {renewalDate
                ? ` · Renews ${formatDate(renewalDate)}`
                : ""}
            </p>
          </div>
        </div>

        {currentPlanId !== "free" && (
          <button className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50">
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
    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-100">
        <h2 className="text-base font-semibold text-neutral-900">
          Choose Your Plan
        </h2>
        <p className="mt-0.5 text-sm text-neutral-500">
          Upgrade at any time. Changes take effect immediately.
        </p>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-100">
              <th className="py-4 pl-6 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 w-40">
                Feature
              </th>
              {PLANS.map((plan) => {
                const isCurrent = plan.id === currentPlanId;
                const Icon = getPlanIcon(plan.id);
                return (
                  <th
                    key={plan.id}
                    className={`py-4 px-4 text-center ${
                      isCurrent
                        ? "bg-[#E8F5EE]"
                        : plan.highlight
                          ? "bg-neutral-50"
                          : ""
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Icon
                        className={`size-5 ${isCurrent ? "text-[#1B4D3E]" : "text-neutral-400"}`}
                      />
                      <span
                        className={`text-sm font-bold ${isCurrent ? "text-[#1B4D3E]" : "text-neutral-800"}`}
                      >
                        {plan.name}
                      </span>
                      <span className="text-xs text-neutral-500">
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
                        <span className="rounded-full bg-[#1B4D3E] px-2 py-0.5 text-xs font-medium text-white">
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
                className="border-b border-neutral-100 last:border-0"
              >
                <td className="py-3 pl-6 pr-4 text-sm font-medium text-neutral-700">
                  {row.label}
                </td>
                {PLANS.map((plan) => {
                  const isCurrent = plan.id === currentPlanId;
                  const value = plan[row.key];
                  return (
                    <td
                      key={plan.id}
                      className={`py-3 px-4 text-center text-sm ${
                        isCurrent
                          ? "bg-[#E8F5EE] text-[#1B4D3E] font-medium"
                          : "text-neutral-600"
                      }`}
                    >
                      {typeof value === "number" ? (
                        value === 0 ? (
                          <span className="text-neutral-300">—</span>
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
            <tr className="border-t border-neutral-200 bg-neutral-50">
              <td className="py-4 pl-6 pr-4 text-sm font-medium text-neutral-500">
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
                    className={`py-4 px-4 text-center ${isCurrent ? "bg-[#E8F5EE]" : ""}`}
                  >
                    {isCurrent ? (
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-[#1B4D3E]">
                        <Check className="size-4" /> Current
                      </span>
                    ) : isDowngrade ? (
                      <button
                        onClick={() => onUpgrade(plan.id)}
                        className="rounded-lg border border-neutral-300 px-4 py-1.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100"
                      >
                        Downgrade
                      </button>
                    ) : (
                      <button
                        onClick={() => onUpgrade(plan.id)}
                        className="rounded-lg bg-[#1B4D3E] px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-[#163d31]"
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
      <div className="md:hidden divide-y divide-neutral-100">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          const Icon = getPlanIcon(plan.id);
          const isDowngrade =
            PLANS.findIndex((p) => p.id === plan.id) <
            PLANS.findIndex((p) => p.id === currentPlanId);

          return (
            <div
              key={plan.id}
              className={`p-5 ${isCurrent ? "bg-[#E8F5EE] border-l-4 border-[#1B4D3E]" : ""}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon
                    className={`size-5 ${isCurrent ? "text-[#1B4D3E]" : "text-neutral-400"}`}
                  />
                  <div>
                    <p
                      className={`text-sm font-bold ${isCurrent ? "text-[#1B4D3E]" : "text-neutral-800"}`}
                    >
                      {plan.name}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {plan.priceMonthly !== null
                        ? `£${plan.priceMonthly}/mo`
                        : "Free"}
                    </p>
                  </div>
                </div>
                {isCurrent ? (
                  <span className="rounded-full bg-[#1B4D3E] px-2 py-0.5 text-xs font-medium text-white">
                    Current
                  </span>
                ) : isDowngrade ? (
                  <button
                    onClick={() => onUpgrade(plan.id)}
                    className="rounded-lg border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-600"
                  >
                    Downgrade
                  </button>
                ) : (
                  <button
                    onClick={() => onUpgrade(plan.id)}
                    className="rounded-lg bg-[#1B4D3E] px-3 py-1 text-xs font-semibold text-white"
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
                      <span className="text-neutral-500">{row.label}</span>
                      <span
                        className={`font-medium ${isCurrent ? "text-[#1B4D3E]" : "text-neutral-700"}`}
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

function PaymentMethodSection(props: Readonly<{ stripeEnabled: boolean }>) {
  const { stripeEnabled } = props;

  if (!stripeEnabled) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-6">
        <div className="flex items-center gap-3">
          <CreditCard className="size-5 text-neutral-400" />
          <div>
            <p className="text-sm font-medium text-neutral-700">
              Payment Method
            </p>
            <p className="mt-0.5 text-xs text-neutral-400">
              Stripe billing is not yet configured. Check back soon.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-neutral-900">
        Payment Method
      </h2>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Card artwork */}
          <div className="flex size-12 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50">
            <CreditCard className="size-6 text-neutral-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-800">
              Visa ending in{" "}
              <span className="font-bold tracking-widest">4242</span>
            </p>
            <p className="mt-0.5 text-xs text-neutral-400">Expires 12 / 2028</p>
          </div>
        </div>
        <button className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50">
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

function billingStatusConfig(status: BillingStatus) {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-700";
    case "pending":
      return "bg-amber-100 text-amber-700";
    case "failed":
      return "bg-red-100 text-red-700";
  }
}

function BillingHistorySection(
  props: Readonly<{ rows: BillingRow[] }>,
) {
  const { rows } = props;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-100">
        <h2 className="text-base font-semibold text-neutral-900">
          Billing History
        </h2>
      </div>

      {rows.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-neutral-500">No billing history yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="py-3 px-6 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Date
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Amount
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Status
                </th>
                <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Invoice
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition"
                >
                  <td className="py-3 px-6 text-sm text-neutral-600">
                    {formatDate(row.date)}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-neutral-900">
                    {formatGBP(row.amount)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${billingStatusConfig(row.status)}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {row.invoiceUrl ? (
                      <a
                        href={row.invoiceUrl}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#1B4D3E] hover:underline"
                      >
                        <Download className="size-3" />
                        Download
                      </a>
                    ) : (
                      <span className="text-xs text-neutral-400">—</span>
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
    <div className="space-y-6">
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
