"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import type { Plan, BillingRole, BillingInterval } from "@/lib/billing-config";

function formatGBP(pence: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
  }).format(pence / 100);
}

type Props = Readonly<{
  plans: readonly Plan[];
  role: BillingRole;
  disabled?: boolean;
}>;

export function PlanGrid({ plans, role, disabled }: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [interval, setInterval] = useState<BillingInterval>("monthly");

  const isAnnual = interval === "annual";

  async function handleSubscribe(plan: Plan) {
    if (disabled) return;
    setLoadingId(plan.id);
    try {
      const priceId = isAnnual ? plan.priceIdAnnual : plan.priceIdMonthly;
      const amount = isAnnual ? plan.priceAnnual : plan.priceMonthly;
      const returnUrl = `${window.location.origin}/dashboard/${role}/billing/confirmation?plan=${encodeURIComponent(plan.name)}&amount=${amount}&session_id={CHECKOUT_SESSION_ID}`;

      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price_id: priceId,
          return_url: returnUrl,
          mode: "subscription",
          role,
        }),
      });
      const data = (await res.json()) as { clientSecret?: string; error?: string };
      if (!res.ok || !data.clientSecret) throw new Error(data.error ?? "Failed to start checkout");

      // Navigate to the embedded checkout page with the clientSecret
      const params = new URLSearchParams({
        clientSecret: data.clientSecret,
        planName: plan.name,
        planPrice: String(amount),
        interval: interval,
        features: JSON.stringify(plan.features),
      });
      window.location.href = `/dashboard/${role}/billing/checkout/subscription?${params.toString()}`;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start checkout");
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Monthly / Annual toggle */}
      <div className="flex items-center justify-center gap-3">
        <span
          className={`text-sm font-medium ${!isAnnual ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-500 dark:text-neutral-400"}`}
        >
          Monthly
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={isAnnual}
          aria-label="Toggle annual billing"
          onClick={() => setInterval(isAnnual ? "monthly" : "annual")}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 ${
            isAnnual ? "bg-brand-primary" : "bg-neutral-200 dark:bg-neutral-700"
          }`}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              isAnnual ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
        <span
          className={`text-sm font-medium ${isAnnual ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-500 dark:text-neutral-400"}`}
        >
          Annual
        </span>
        {isAnnual && (
          <Badge className="bg-success-light text-success dark:bg-success/20 dark:text-success text-xs">
            Save up to 20%
          </Badge>
        )}
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const displayPrice = isAnnual ? plan.priceAnnual : plan.priceMonthly;
          const monthlyEquivalent = isAnnual ? Math.round(plan.priceAnnual / 12) : plan.priceMonthly;
          const monthlySaving = plan.priceMonthly * 12 - plan.priceAnnual;

          return (
            <Card
              key={plan.id}
              className={`relative flex flex-col transition-shadow hover:shadow-md ${
                plan.highlighted
                  ? "border-2 border-brand-primary ring-2 ring-brand-primary/10"
                  : ""
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-brand-primary text-white text-xs px-3">Most popular</Badge>
                </div>
              )}
              <CardHeader className="pb-3 pt-6">
                <CardTitle className="font-heading text-lg font-semibold text-foreground">
                  {plan.name}
                </CardTitle>
                <div className="mt-2">
                  {isAnnual ? (
                    <>
                      <span className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                        {formatGBP(monthlyEquivalent)}
                      </span>
                      <span className="text-sm text-neutral-500">/mo</span>
                      <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                        {formatGBP(displayPrice)} billed annually
                      </div>
                      {monthlySaving > 0 && (
                        <Badge className="mt-1.5 bg-success-light text-success dark:bg-success/20 dark:text-success text-xs">
                          Save {formatGBP(monthlySaving)}!
                        </Badge>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                        {formatGBP(displayPrice)}
                      </span>
                      <span className="text-sm text-neutral-500">/month</span>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <ul className="flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                      <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-brand-primary dark:text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => void handleSubscribe(plan)}
                  disabled={!!disabled || loadingId !== null}
                  className={`w-full ${
                    plan.highlighted
                      ? "bg-brand-primary text-white hover:bg-brand-primary-light"
                      : ""
                  }`}
                  variant={plan.highlighted ? "default" : "outline"}
                >
                  {loadingId === plan.id
                    ? "Loading checkout…"
                    : disabled
                    ? "Already subscribed"
                    : `Subscribe — ${formatGBP(monthlyEquivalent)}/mo`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
