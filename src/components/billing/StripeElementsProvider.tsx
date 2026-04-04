"use client";

/**
 * Lazy-loaded Stripe Elements provider.
 * Only loaded on billing pages — keeps Stripe.js off all other routes.
 *
 * Usage:
 *   <StripeElementsProvider>
 *     <CheckoutForm />
 *   </StripeElementsProvider>
 *
 * The loadStripe promise is created once outside the component to avoid
 * re-initializing on every render.
 */

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import type { StripeElementsOptions } from "@stripe/stripe-js";

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// Singleton promise — created once at module load time
const stripePromise = stripePublishableKey
  ? loadStripe(stripePublishableKey)
  : null;

type Props = Readonly<{
  children: React.ReactNode;
  clientSecret?: string; // Pass for Payment Element flows
  appearance?: StripeElementsOptions["appearance"];
}>;

export function StripeElementsProvider({ children, clientSecret, appearance }: Props) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // SSR placeholder — Stripe.js is browser-only
    return <>{children}</>;
  }

  if (!stripePromise) {
    return (
      <div className="rounded-lg border border-warning/20 bg-warning-light p-4 text-sm text-warning dark:border-warning/30 dark:bg-warning/10 dark:text-warning">
        Payment service is not configured. Please contact support.
      </div>
    );
  }

  const options: StripeElementsOptions = {
    ...(clientSecret ? { clientSecret } : {}),
    appearance: appearance ?? {
      theme: "stripe",
      variables: {
        colorPrimary: "#1B4D3E",
        colorBackground: "#ffffff",
        colorText: "#1f2937",
        colorDanger: "#ef4444",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        borderRadius: "8px",
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}
