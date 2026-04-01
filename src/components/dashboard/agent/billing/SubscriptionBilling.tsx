"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, CreditCard, ExternalLink, Zap } from "lucide-react";

type Plan = {
  name: string;
  price: number;
  priceId: string;
  description: string;
  features: string[];
  highlighted?: boolean;
};

const PLANS: Plan[] = [
  {
    name: "Basic",
    price: 99,
    priceId: "price_basic_monthly",
    description: "For independent agents getting started",
    features: [
      "Up to 10 active listings",
      "Lead management CRM",
      "Viewing scheduler",
      "Email support",
      "Basic analytics",
    ],
  },
  {
    name: "Professional",
    price: 199,
    priceId: "price_pro_monthly",
    description: "For growing agencies with multiple negotiators",
    highlighted: true,
    features: [
      "Up to 50 active listings",
      "Full CRM with pipeline tracking",
      "Automated viewing reminders",
      "Offer management suite",
      "Sale progression tracker",
      "Team members (up to 5)",
      "Priority email & phone support",
      "Advanced analytics & reports",
      "Vendor report generator",
    ],
  },
  {
    name: "Enterprise",
    price: 399,
    priceId: "price_enterprise_monthly",
    description: "For multi-branch agencies at scale",
    features: [
      "Unlimited active listings",
      "Unlimited team members",
      "Multi-branch management",
      "Property feed integrations (Reapit, Alto, Jupix)",
      "API access",
      "White-label vendor portal",
      "Dedicated account manager",
      "SLA-backed support",
      "Custom analytics dashboards",
    ],
  },
];

type Props = Readonly<{ subscription: unknown | null }>;

export function SubscriptionBilling({ subscription }: Props) {
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);

  const hasSubscription = subscription !== null;

  async function handleSubscribe(priceId: string) {
    setLoadingPriceId(priceId);
    try {
      const res = await fetch("/api/agent/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "checkout",
          priceId,
          successUrl: "/dashboard/agent/billing?success=1",
          cancelUrl: "/dashboard/agent/billing",
        }),
      });

      if (res.status === 503 || res.status === 501) {
        toast.error("Billing not configured. Please contact support.");
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Checkout failed");
      }

      const { url } = (await res.json()) as { url?: string };
      if (url) {
        window.location.href = url;
      }
    } catch {
      toast.error("Billing not configured. Please contact support.");
    } finally {
      setLoadingPriceId(null);
    }
  }

  async function handlePortal() {
    setLoadingPortal(true);
    try {
      const res = await fetch("/api/agent/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "portal",
          returnUrl: window.location.href,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Portal unavailable");
      }

      const { url } = (await res.json()) as { url?: string };
      if (url) {
        window.location.href = url;
      }
    } catch {
      toast.error("Billing not configured. Please contact support.");
    } finally {
      setLoadingPortal(false);
    }
  }

  if (hasSubscription) {
    const sub = subscription as Record<string, unknown>;
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Billing</h1>
          <p className="text-muted-foreground">Manage your Britestate subscription</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-heading text-lg">Current Plan</CardTitle>
              <Badge className="bg-brand-primary-lighter text-brand-primary border-brand-primary/20">Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3 text-sm">
              <div>
                <p className="text-muted-foreground">Plan</p>
                <p className="font-medium">{String(sub.plan_name ?? "Professional")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Monthly cost</p>
                <p className="font-medium">{String(sub.amount ?? "£199")}/mo</p>
              </div>
              <div>
                <p className="text-muted-foreground">Next renewal</p>
                <p className="font-medium">{String(sub.current_period_end ?? "—")}</p>
              </div>
            </div>

            <Button onClick={handlePortal} disabled={loadingPortal} variant="outline">
              <ExternalLink className="mr-2 size-4" />
              {loadingPortal ? "Opening portal…" : "Manage Subscription"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Invoice history is available in the Stripe Customer Portal.
            </p>
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground">
          Britestate charges a 2.5% platform commission on completed sales.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Choose a Plan</h1>
        <p className="text-muted-foreground">
          Get started with Britestate — grow your agency with the right tools.
        </p>
      </div>

      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <CardContent className="flex items-center gap-3 pt-4 pb-4">
          <Zap className="size-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            No active plan. Subscribe below to unlock your agent dashboard features.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <Card
            key={plan.priceId}
            className={plan.highlighted ? "border-brand-primary shadow-md ring-1 ring-brand-primary" : ""}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-heading text-lg">{plan.name}</CardTitle>
                {plan.highlighted && (
                  <Badge className="bg-brand-primary text-white border-0 text-xs">Popular</Badge>
                )}
              </div>
              <div className="flex items-end gap-1">
                <span className="text-3xl font-bold">£{plan.price}</span>
                <span className="text-muted-foreground pb-0.5">/mo</span>
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-brand-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={plan.highlighted ? "default" : "outline"}
                disabled={loadingPriceId === plan.priceId}
                onClick={() => handleSubscribe(plan.priceId)}
              >
                <CreditCard className="mr-2 size-4" />
                {loadingPriceId === plan.priceId ? "Redirecting…" : "Subscribe"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        Britestate charges a 2.5% platform commission on completed sales.
      </p>
    </div>
  );
}
