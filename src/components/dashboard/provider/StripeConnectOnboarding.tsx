"use client";

import { useState } from "react";
import { CreditCard, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StripeConnectOnboarding() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/connect/create-account", {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Failed to initiate Stripe Connect");
      }

      const data = await res.json() as { onboarding_url: string };
      window.location.href = data.onboarding_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-brand-primary-dark text-white p-6 md:p-8 shadow-lg">
      {/* Decorative circles */}
      <div className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -right-2 -bottom-10 size-28 rounded-full bg-white/5" />

      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        {/* Left: icon + copy */}
        <div className="flex items-start gap-4">
          <div className="shrink-0 rounded-xl bg-brand-gold/20 p-3">
            <CreditCard className="size-6 text-brand-gold" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">
              Connect your bank account to receive payments
            </h2>
            <p className="mt-1 text-sm text-white/70">
              Set up Stripe Connect to receive client payments directly into your bank
              account. Takes 5 minutes — you&apos;ll need your business details and bank
              information.
            </p>
            {error && (
              <p className="mt-2 text-sm font-medium text-red-300">{error}</p>
            )}
          </div>
        </div>

        {/* Right: action + powered-by */}
        <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
          <Button
            onClick={handleConnect}
            disabled={loading}
            className="bg-brand-gold text-brand-gold-foreground hover:opacity-90 font-semibold shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Connecting…
              </>
            ) : (
              <>
                Connect Stripe
                <ExternalLink className="ml-2 size-4" />
              </>
            )}
          </Button>
          <p className="text-xs text-white/50">Powered by Stripe</p>
        </div>
      </div>
    </div>
  );
}
