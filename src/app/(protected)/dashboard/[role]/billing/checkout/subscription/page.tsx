"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { PlanGrid } from "@/components/billing/PlanGrid";
import { ArrowLeft, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import type { Plan, BillingRole } from "@/lib/billing-config";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

// ---------------------------------------------------------------------------
// Plan data is fetched from a server endpoint to avoid importing server-only
// billing-config in a client component. We inline the fetch so the page is
// self-contained.
// ---------------------------------------------------------------------------

function usePlans(role: BillingRole) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/billing/plans?role=${role}`)
      .then((r) => r.json())
      .then((data: { plans?: Plan[] }) => setPlans(data.plans ?? []))
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, [role]);

  return { plans, loading };
}

// ---------------------------------------------------------------------------
// Embedded checkout view (2-column: plan details + Stripe form)
// ---------------------------------------------------------------------------

function EmbeddedCheckoutView() {
  const params = useParams<{ role: string }>();
  const searchParams = useSearchParams();

  const clientSecret = searchParams.get("clientSecret");
  const planName = searchParams.get("planName") ?? "Plan";
  const planPrice = searchParams.get("planPrice");
  const interval = searchParams.get("interval") ?? "monthly";
  const featuresRaw = searchParams.get("features");

  const basePath = `/dashboard/${params.role}/billing`;

  const features: string[] = (() => {
    try {
      return featuresRaw ? (JSON.parse(featuresRaw) as string[]) : [];
    } catch {
      return [];
    }
  })();

  const formattedPrice = planPrice
    ? new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
        minimumFractionDigits: 0,
      }).format(Number(planPrice) / 100)
    : null;

  const isAnnual = interval === "annual";
  const monthlyEquivalent = isAnnual && planPrice
    ? new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
        minimumFractionDigits: 0,
      }).format(Math.round(Number(planPrice) / 12) / 100)
    : null;

  if (!clientSecret || !stripePromise) {
    return null;
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`${basePath}/checkout/subscription`}><ArrowLeft size={16} /></Link>
        </Button>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
            Subscription Checkout
          </p>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-brand-primary-dark">
            Complete your subscription
          </h1>
          <p className="text-sm text-neutral-500">
            Secure checkout powered by Stripe
          </p>
        </div>
      </div>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        {/* Left: Plan details */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
              Selected Plan
            </p>
            <h2 className="font-heading mt-1 text-2xl font-bold tracking-tight text-brand-primary-dark">
              {planName}
            </h2>
            {formattedPrice && (
              <div className="mt-3">
                {isAnnual && monthlyEquivalent ? (
                  <>
                    <span className="text-3xl font-bold text-brand-primary-dark">
                      {monthlyEquivalent}
                    </span>
                    <span className="text-sm text-neutral-500">/mo</span>
                    <p className="mt-1 text-xs text-neutral-500">
                      {formattedPrice} billed annually
                    </p>
                  </>
                ) : (
                  <>
                    <span className="text-3xl font-bold text-brand-primary-dark">
                      {formattedPrice}
                    </span>
                    <span className="text-sm text-neutral-500">/month</span>
                  </>
                )}
              </div>
            )}

            {features.length > 0 && (
              <ul className="mt-5 space-y-2.5 border-t border-border pt-4">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-brand-primary" />
                    {f}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-xs text-neutral-500">
            <ShieldCheck size={14} className="shrink-0 text-brand-primary" />
            <span>14-day refund guarantee. Cancel anytime.</span>
          </div>
        </div>

        {/* Right: Stripe Embedded Checkout */}
        <div className="lg:col-span-3">
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{ clientSecret }}
          >
            <EmbeddedCheckout className="rounded-lg" />
          </EmbeddedCheckoutProvider>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Plan selection view (default when no clientSecret)
// ---------------------------------------------------------------------------

function PlanSelectionView() {
  const params = useParams<{ role: string }>();

  const billingRole = (["agent", "landlord", "provider"].includes(params.role)
    ? params.role
    : "agent") as BillingRole;

  const { plans, loading } = usePlans(billingRole);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
          Subscription Management
        </p>
        <h1 className="font-heading mt-1 text-3xl font-bold tracking-tight text-brand-primary-dark md:text-4xl">
          Choose your plan
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          All plans include a 14-day refund guarantee. Cancel anytime.
        </p>
      </div>

      <PlanGrid
        plans={plans}
        role={billingRole}
      />

      <div className="mt-4 text-center">
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          Skip for now — explore TrueDeed first
        </Link>
      </div>

      <p className="text-center text-xs text-neutral-400">
        A 2.5% platform commission applies on sales transactions. All billing is managed securely via Stripe.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page component — dispatches based on whether clientSecret is present
// ---------------------------------------------------------------------------

function SubscriptionCheckoutContent() {
  const searchParams = useSearchParams();
  const hasCheckout = searchParams.has("clientSecret");

  if (hasCheckout) {
    return <EmbeddedCheckoutView />;
  }

  return <PlanSelectionView />;
}

export default function SubscriptionCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      }
    >
      <SubscriptionCheckoutContent />
    </Suspense>
  );
}
