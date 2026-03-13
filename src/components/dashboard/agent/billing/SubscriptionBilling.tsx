"use client";

import { useState } from "react";

type Plan = {
  id: string;
  name: string;
  price: string;
  priceId: string;
  features: string[];
};

const PLANS: Plan[] = [
  {
    id: "basic",
    name: "Basic",
    price: "29",
    priceId: "price_basic_monthly",
    features: [
      "Up to 25 active listings",
      "Basic lead management",
      "Email support",
      "Standard analytics",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    price: "79",
    priceId: "price_professional_monthly",
    features: [
      "Up to 100 active listings",
      "Advanced CRM & lead pipeline",
      "Priority support",
      "Detailed analytics & reports",
      "Team management (up to 5)",
      "Featured listings (2/month)",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "199",
    priceId: "price_enterprise_monthly",
    features: [
      "Unlimited listings",
      "Full CRM suite",
      "Dedicated account manager",
      "Custom analytics & API access",
      "Unlimited team members",
      "Featured listings (10/month)",
      "Property feed integrations",
    ],
  },
];

function CheckIcon() {
  return (
    <svg
      className="h-4 w-4 text-green-500"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function SubscriptionBilling(
  props: Readonly<{ subscription: Record<string, unknown> | null }>,
) {
  const { subscription } = props;
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasSubscription =
    subscription !== null && subscription.subscription_status === "active";

  async function handleCheckout(plan: Plan) {
    setLoading(plan.id);
    setError(null);
    try {
      const res = await fetch("/api/agent/billing?action=checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price_id: plan.priceId,
          success_url: `${window.location.origin}/dashboard/agent/billing?success=true`,
          cancel_url: `${window.location.origin}/dashboard/agent/billing?cancelled=true`,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to create checkout session");
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  async function handleManage() {
    setLoading("manage");
    setError(null);
    try {
      const res = await fetch("/api/agent/billing?action=portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to open billing portal");
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Subscription & Billing
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your subscription plan and billing details.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Active subscription card */}
      {hasSubscription && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-900/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Current Plan:{" "}
                {(subscription.subscription_plan as string) ?? "Active"}
              </h2>
              <span className="mt-1 inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/50 dark:text-green-400">
                Active
              </span>
            </div>
            <button
              type="button"
              onClick={handleManage}
              disabled={loading === "manage"}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            >
              {loading === "manage"
                ? "Opening..."
                : "Manage Subscription"}
            </button>
          </div>
        </div>
      )}

      {/* No subscription */}
      {!hasSubscription && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-center dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            No Active Plan
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Choose a plan below to get started with Britestate for agents.
          </p>
        </div>
      )}

      {/* Plan cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-lg border p-6 ${
              plan.id === "professional"
                ? "border-blue-500 ring-2 ring-blue-500 dark:border-blue-400 dark:ring-blue-400"
                : "border-gray-200 dark:border-gray-700"
            } bg-white dark:bg-gray-800`}
          >
            {plan.id === "professional" && (
              <span className="mb-3 inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/50 dark:text-blue-400">
                Most Popular
              </span>
            )}
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {plan.name}
            </h3>
            <p className="mt-2">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                &pound;{plan.price}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                /month
              </span>
            </p>
            <ul className="mt-6 space-y-3">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300"
                >
                  <CheckIcon />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => handleCheckout(plan)}
              disabled={loading === plan.id}
              className={`mt-6 w-full rounded-md px-4 py-2.5 text-sm font-medium disabled:opacity-50 ${
                plan.id === "professional"
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
              }`}
            >
              {loading === plan.id ? "Processing..." : "Subscribe"}
            </button>
          </div>
        ))}
      </div>

      {/* Commission notice */}
      <p className="text-center text-xs text-gray-400 dark:text-gray-500">
        2.5% platform commission on all transactions
      </p>
    </div>
  );
}
