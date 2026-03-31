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
          <h1 className="font-heading text-xl font-semibold text-foreground">
            Complete your subscription
          </h1>
          <p className="font-body text-sm text-neutral-500">
            Secure checkout powered by Stripe
          </p>
        </div>
      </div>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        {/* Left: Plan details */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-xl bg-card p-6 shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
            <h2 className="font-heading text-base font-semibold text-foreground">
              {planName}
            </h2>
            {formattedPrice && (
              <div className="mt-2">
                {isAnnual && monthlyEquivalent ? (
                  <>
                    <span className="font-heading text-3xl font-bold text-foreground">
                      {monthlyEquivalent}
                    </span>
                    <span className="font-body text-sm text-neutral-500">/mo</span>
                    <p className="mt-1 font-body text-xs text-neutral-500">
                      {formattedPrice} billed annually
                    </p>
                  </>
                ) : (
                  <>
                    <span className="font-heading text-3xl font-bold text-foreground">
                      {formattedPrice}
                    </span>
                    <span className="font-body text-sm text-neutral-500">/month</span>
                  </>
                )}
              </div>
            )}

            {features.length > 0 && (
              <ul className="mt-4 space-y-2">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 font-body text-sm text-foreground">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-green-600 dark:text-green-400" />
                    {f}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center gap-2 font-body text-xs text-neutral-500">
            <ShieldCheck size={14} />
            <span>14-day refund guarantee. Cancel anytime.</span>
          </div>
        </div>

        {/* Right: Stripe Embedded Checkout */}
        <div className="lg:col-span-3">
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{ clientSecret }}
          >
            <EmbeddedCheckout className="rounded-xl" />
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
        <h1 className="font-heading text-xl font-semibold text-foreground">
          Choose your plan
        </h1>
        <p className="mt-1 font-body text-sm text-neutral-500">
          All plans include a 14-day refund guarantee. Cancel anytime.
        </p>
      </div>

      <PlanGrid
        plans={plans}
        role={billingRole}
      />

      <div className="mt-4 text-center">
        <Link href="/" className="font-body text-sm text-muted-foreground hover:underline">
          Skip for now — explore Britestate first
        </Link>
      </div>

      <p className="text-center font-body text-xs text-neutral-500">
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
