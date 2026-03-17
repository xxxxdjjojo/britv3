"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Calendar,
  RefreshCw,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export type StripeSubscriptionSummary = Readonly<{
  id: string;
  status: string;
  plan_name: string;
  price_amount: number; // pence
  currency: string;
  interval: string;
  current_period_end: number; // Unix timestamp
  cancel_at_period_end: boolean;
}>;

export type StripeInvoiceSummary = Readonly<{
  id: string;
  created: number; // Unix timestamp
  amount_paid: number; // pence
  currency: string;
  status: string;
  invoice_pdf: string | null;
}>;

export type SubscriptionBillingProps = Readonly<{
  subscription: StripeSubscriptionSummary | null;
  invoices: StripeInvoiceSummary[];
}>;

// ============================================================================
// Subscription plan definitions (Britestate agent tiers)
// ============================================================================

type Plan = {
  name: string;
  priceId: string; // Stripe price ID — set via env or CMS in production
  price: number; // monthly pence
  interval: string;
  features: string[];
  highlighted?: boolean;
};

const PLANS: Plan[] = [
  {
    name: "Basic",
    priceId: process.env.NEXT_PUBLIC_STRIPE_AGENT_BASIC_PRICE_ID ?? "price_agent_basic",
    price: 4900, // £49/month
    interval: "month",
    features: [
      "Up to 25 active listings",
      "Standard property photos",
      "Lead management",
      "Email support",
    ],
  },
  {
    name: "Professional",
    priceId: process.env.NEXT_PUBLIC_STRIPE_AGENT_PRO_PRICE_ID ?? "price_agent_pro",
    price: 9900, // £99/month
    interval: "month",
    features: [
      "Unlimited active listings",
      "Premium photo hosting",
      "Full CRM suite",
      "Viewing calendar",
      "Offer management",
      "Priority support",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    priceId: process.env.NEXT_PUBLIC_STRIPE_AGENT_ENT_PRICE_ID ?? "price_agent_enterprise",
    price: 24900, // £249/month
    interval: "month",
    features: [
      "Everything in Professional",
      "Multi-branch management",
      "Team member accounts",
      "API access",
      "Dedicated account manager",
      "Custom branding",
    ],
  },
];

// ============================================================================
// Helpers
// ============================================================================

function formatGBP(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(pence / 100);
}

function formatDate(unix: number): string {
  return new Date(unix * 1000).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    active: { label: "Active", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
    trialing: { label: "Trial", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
    past_due: { label: "Past due", className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
    canceled: { label: "Cancelled", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
    paid: { label: "Paid", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
    open: { label: "Open", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
    uncollectible: { label: "Failed", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  };
  const cfg = map[status] ?? { label: status, className: "bg-gray-100 text-gray-800" };
  return <Badge className={`${cfg.className} text-xs`}>{cfg.label}</Badge>;
}

// ============================================================================
// No subscription state
// ============================================================================

function NoPlanCard() {
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);

  async function handleSubscribe(priceId: string) {
    setLoadingPriceId(priceId);
    try {
      const successUrl = `${window.location.origin}/dashboard/agent/billing?success=1`;
      const cancelUrl = `${window.location.origin}/dashboard/agent/billing`;
      const res = await fetch("/api/agent/billing?action=checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price_id: priceId, success_url: successUrl, cancel_url: cancelUrl }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Failed to start checkout");
      window.location.href = data.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start checkout");
    } finally {
      setLoadingPriceId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
        <CardContent className="flex items-start gap-3 py-4">
          <AlertCircle className="mt-0.5 shrink-0 text-orange-500" size={18} />
          <div>
            <p className="font-medium text-orange-900 dark:text-orange-100">No active plan</p>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              Subscribe to a plan to start listing properties and managing clients on Britestate.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {PLANS.map((plan) => (
          <Card
            key={plan.name}
            className={plan.highlighted ? "border-blue-400 ring-2 ring-blue-400" : ""}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                {plan.name}
                {plan.highlighted && (
                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs">
                    Most popular
                  </Badge>
                )}
              </CardTitle>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatGBP(plan.priceMonthly)}
                <span className="text-sm font-normal text-gray-500">/month</span>
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-green-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={plan.highlighted ? "default" : "outline"}
                onClick={() => void handleSubscribe(plan.priceIdMonthly)}
                disabled={loadingPriceId !== null}
              >
                {loadingPriceId === plan.priceIdMonthly ? "Redirecting..." : `Subscribe — ${formatGBP(plan.priceMonthly)}/mo`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500">
        A 2.5% platform commission applies on sales transactions completed through Britestate, in addition to your monthly subscription fee.
      </p>
    </div>
  );
}

// ============================================================================
// Active subscription state
// ============================================================================

function ActiveSubscriptionCard({
  subscription,
  invoices,
}: Readonly<{
  subscription: StripeSubscriptionSummary;
  invoices: StripeInvoiceSummary[];
}>) {
  const [isRedirecting, setIsRedirecting] = useState(false);

  async function handleManage() {
    setIsRedirecting(true);
    try {
      const returnUrl = `${window.location.origin}/dashboard/agent/billing`;
      const res = await fetch("/api/agent/billing?action=portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ return_url: returnUrl }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Failed to open billing portal");
      window.location.href = data.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to open billing portal");
    } finally {
      setIsRedirecting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Current plan card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard size={16} className="text-blue-500" />
              Current Plan
            </CardTitle>
            {statusBadge(subscription.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Plan</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {subscription.plan_name || "Britestate Agent"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Price</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {formatGBP(subscription.price_amount)}/{subscription.interval}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Next renewal</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1">
                <Calendar size={13} />
                {formatDate(subscription.current_period_end)}
              </p>
            </div>
            {subscription.cancel_at_period_end && (
              <div>
                <p className="text-xs text-orange-500 font-semibold">Cancels on</p>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  {formatDate(subscription.current_period_end)}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={() => void handleManage()} disabled={isRedirecting} className="gap-1.5">
              <ExternalLink size={14} />
              {isRedirecting ? "Opening portal..." : "Manage Subscription"}
            </Button>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Upgrade, downgrade, cancel, or update payment via Stripe portal
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Payment history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw size={15} className="text-gray-400" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500">No invoices yet.</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatDate(inv.created)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatGBP(inv.amount_paid)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {statusBadge(inv.status)}
                    {inv.invoice_pdf && (
                      <a
                        href={inv.invoice_pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline dark:text-blue-400 flex items-center gap-1"
                      >
                        <ExternalLink size={12} />
                        PDF
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-gray-400 dark:text-gray-500">
        A 2.5% platform commission applies on sales transactions completed through Britestate, in addition to your monthly subscription fee. All billing changes are managed securely via Stripe.
      </p>
    </div>
  );
}

// ============================================================================
// Main SubscriptionBilling component
// ============================================================================

export function SubscriptionBilling({ subscription, invoices }: SubscriptionBillingProps) {
  if (!subscription) {
    return <NoPlanCard />;
  }

  return <ActiveSubscriptionCard subscription={subscription} invoices={invoices} />;
}
