"use client";

import { Suspense, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Zap, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

type BoostOption = {
  id: string;
  label: string;
  duration: string;
  price: string;
  pence: number;
  priceId: string;
  description: string;
  highlighted?: boolean;
};

// Boost options — price IDs come from server; hardcoded here for display only
const BOOST_OPTIONS: BoostOption[] = [
  {
    id: "7d",
    label: "7-Day Boost",
    duration: "7 days",
    price: "\u00a315",
    pence: 1500,
    priceId: process.env.NEXT_PUBLIC_STRIPE_BOOST_7D_PRICE_ID ?? "price_boost_7d_test",
    description: "Get 3x more views for a week",
  },
  {
    id: "14d",
    label: "14-Day Boost",
    duration: "14 days",
    price: "\u00a325",
    pence: 2500,
    priceId: process.env.NEXT_PUBLIC_STRIPE_BOOST_14D_PRICE_ID ?? "price_boost_14d_test",
    description: "Two weeks of premium placement",
    highlighted: true,
  },
  {
    id: "30d",
    label: "30-Day Boost",
    duration: "30 days",
    price: "\u00a345",
    pence: 4500,
    priceId: process.env.NEXT_PUBLIC_STRIPE_BOOST_30D_PRICE_ID ?? "price_boost_30d_test",
    description: "Maximum exposure for a full month",
  },
];

function OneTimeCheckoutContent() {
  const params = useParams<{ role: string }>();
  const searchParams = useSearchParams();
  const listingId = searchParams.get("listingId") ?? "";

  // If clientSecret is in URL, show embedded checkout directly
  const clientSecretParam = searchParams.get("clientSecret");
  const boostLabel = searchParams.get("boostLabel") ?? "Featured Boost";
  const boostPrice = searchParams.get("boostPrice") ?? "";

  const [selectedBoost, setSelectedBoost] = useState<BoostOption | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutState, setCheckoutState] = useState<{
    clientSecret: string;
    boost: BoostOption;
  } | null>(
    clientSecretParam
      ? {
          clientSecret: clientSecretParam,
          boost: BOOST_OPTIONS.find((b) => b.label === boostLabel) ?? BOOST_OPTIONS[0],
        }
      : null,
  );

  const basePath = `/dashboard/${params.role}/billing`;

  async function handleCheckout() {
    if (!selectedBoost) {
      toast.error("Please select a boost option");
      return;
    }
    setIsLoading(true);
    try {
      const returnUrl = `${window.location.origin}${basePath}/confirmation?plan=${encodeURIComponent(selectedBoost.label)}&amount=${selectedBoost.pence}&session_id={CHECKOUT_SESSION_ID}`;

      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price_id: selectedBoost.priceId,
          return_url: returnUrl,
          mode: "payment",
          metadata: listingId
            ? {
                listing_id: listingId,
                duration_days: selectedBoost.id.replace("d", ""),
                boost_type: "featured_listing",
              }
            : undefined,
        }),
      });
      const data = (await res.json()) as { clientSecret?: string; error?: string };
      if (!res.ok || !data.clientSecret) throw new Error(data.error ?? "Failed to start checkout");

      setCheckoutState({ clientSecret: data.clientSecret, boost: selectedBoost });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start checkout");
      setIsLoading(false);
    }
  }

  // Show embedded checkout
  if (checkoutState && stripePromise) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setCheckoutState(null)}>
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="font-heading text-xl font-semibold text-foreground">
              Complete your purchase
            </h1>
            <p className="font-body text-sm text-neutral-500">
              Secure checkout powered by Stripe
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* Left: Boost details */}
          <div className="lg:col-span-2 space-y-5">
            <div className="rounded-xl bg-card p-6 shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-success-light dark:bg-success/20">
                <Zap className="text-success dark:text-success" size={18} />
              </div>
              <h2 className="font-heading text-base font-semibold text-foreground">
                {checkoutState.boost.label}
              </h2>
              <p className="mt-1 font-heading text-3xl font-bold text-foreground">
                {checkoutState.boost.price}
              </p>
              <p className="mt-1 font-body text-sm text-neutral-500">
                {checkoutState.boost.description}
              </p>
              <p className="mt-2 font-body text-xs text-neutral-500">
                Duration: {checkoutState.boost.duration}
              </p>
            </div>

            <div className="flex items-center gap-2 font-body text-xs text-neutral-500">
              <ShieldCheck size={14} />
              <span>One-time payment. Your listing is featured immediately.</span>
            </div>
          </div>

          {/* Right: Stripe Embedded Checkout */}
          <div className="lg:col-span-3">
            <EmbeddedCheckoutProvider
              stripe={stripePromise}
              options={{ clientSecret: checkoutState.clientSecret }}
            >
              <EmbeddedCheckout className="rounded-xl" />
            </EmbeddedCheckoutProvider>
          </div>
        </div>
      </div>
    );
  }

  // Show boost selection
  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={basePath}><ArrowLeft size={16} /></Link>
        </Button>
        <div>
          <h1 className="font-heading text-xl font-semibold text-foreground">
            Feature Your Listing
          </h1>
          <p className="font-body text-sm text-neutral-500">
            Get premium placement and 3x more views
          </p>
        </div>
      </div>

      {!stripePromise && (
        <div className="rounded-xl bg-error-light p-4 ring-1 ring-error/20 dark:bg-error/10 dark:ring-error/30">
          <p className="font-body text-sm text-error dark:text-error">
            Payment service is not configured. Please contact support.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {BOOST_OPTIONS.map((boost) => (
          <Card
            key={boost.id}
            onClick={() => setSelectedBoost(boost)}
            className={`relative cursor-pointer transition-all ${
              selectedBoost?.id === boost.id
                ? "ring-2 ring-brand-primary shadow-md"
                : "ring-1 ring-neutral-200/60 dark:ring-neutral-700/60 hover:shadow-md"
            } ${boost.highlighted ? "ring-2 ring-brand-primary/60" : ""}`}
          >
            {boost.highlighted && (
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center rounded-full bg-warning-light px-2.5 py-0.5 text-xs font-medium text-warning dark:bg-warning/20 dark:text-warning">
                  Best value
                </span>
              </div>
            )}
            <CardContent className="pt-6 pb-4 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-success-light dark:bg-success/20">
                <Zap className="text-success dark:text-success" size={18} />
              </div>
              <p className="font-body text-sm font-medium text-foreground">{boost.label}</p>
              <p className="mt-1 font-heading text-2xl font-bold text-foreground">{boost.price}</p>
              <p className="mt-1 font-body text-xs text-neutral-500">{boost.description}</p>
              {selectedBoost?.id === boost.id && (
                <div className="mt-3 flex items-center justify-center gap-1 font-body text-xs font-medium text-success dark:text-success">
                  <CheckCircle2 size={14} />
                  Selected
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={() => void handleCheckout()}
          disabled={!selectedBoost || isLoading || !stripePromise}
          className="rounded-lg bg-brand-primary px-4 py-2 font-body text-sm font-medium text-white transition-colors hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:opacity-50 inline-flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2"
        >
          {isLoading ? (
            <><Loader2 size={14} className="animate-spin" />Loading checkout…</>
          ) : selectedBoost ? (
            `Pay ${selectedBoost.price} — ${selectedBoost.label}`
          ) : (
            "Select a boost option"
          )}
        </button>
        <Button variant="ghost" asChild>
          <Link href={basePath}>Cancel</Link>
        </Button>
      </div>

      <p className="font-body text-xs text-neutral-500">
        One-time payment. Your listing will be featured immediately after payment. All payments processed securely via Stripe.
      </p>
    </div>
  );
}

export default function OneTimeCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        </div>
      }
    >
      <OneTimeCheckoutContent />
    </Suspense>
  );
}
