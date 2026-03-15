"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import type { Plan, BillingRole } from "@/lib/billing-config";

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
  cancelUrl: string;
  successUrl: string;
  disabled?: boolean;
}>;

export function PlanGrid({ plans, role, cancelUrl, successUrl, disabled }: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleSubscribe(plan: Plan) {
    if (disabled) return;
    setLoadingId(plan.id);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price_id: plan.priceId,
          success_url: `${window.location.origin}${successUrl.replace("{PLAN_NAME}", encodeURIComponent(plan.name)).replace("{AMOUNT}", String(plan.price))}`,
          cancel_url: `${window.location.origin}${cancelUrl}`,
          mode: "subscription",
          role,
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Failed to start checkout");
      window.location.href = data.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start checkout");
      setLoadingId(null);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan) => (
        <Card
          key={plan.id}
          className={`relative flex flex-col transition-shadow hover:shadow-md ${
            plan.highlighted
              ? "border-2 border-[#1B4D3E] ring-2 ring-[#1B4D3E]/10"
              : ""
          }`}
        >
          {plan.highlighted && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-[#1B4D3E] text-white text-xs px-3">Most popular</Badge>
            </div>
          )}
          <CardHeader className="pb-3 pt-6">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
              {plan.name}
            </CardTitle>
            <div className="mt-2">
              <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {formatGBP(plan.price)}
              </span>
              <span className="text-sm text-gray-500">/{plan.interval}</span>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            <ul className="flex-1 space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#1B4D3E] dark:text-emerald-400" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              onClick={() => void handleSubscribe(plan)}
              disabled={!!disabled || loadingId !== null}
              className={`w-full ${
                plan.highlighted
                  ? "bg-[#1B4D3E] text-white hover:bg-[#2D7A5F]"
                  : ""
              }`}
              variant={plan.highlighted ? "default" : "outline"}
            >
              {loadingId === plan.id
                ? "Redirecting to checkout…"
                : disabled
                ? "Already subscribed"
                : `Subscribe — ${formatGBP(plan.price)}/mo`}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
