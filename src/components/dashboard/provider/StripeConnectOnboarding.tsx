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
    <div className="w-full rounded-xl bg-brand-primary text-white p-6 md:p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        {/* Left: icon + copy */}
        <div className="flex items-start gap-4">
          <div className="shrink-0 rounded-full bg-white/10 p-3">
            <CreditCard className="size-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">
              Connect your bank account to receive payments
            </h2>
            <p className="mt-1 text-sm text-white/80">
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
            className="bg-white text-brand-primary hover:bg-white/90 font-semibold"
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
          <p className="text-xs text-white/60">Powered by Stripe</p>
        </div>
      </div>
    </div>
  );
}
