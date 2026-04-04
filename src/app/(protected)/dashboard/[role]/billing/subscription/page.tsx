import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PLANS_BY_ROLE, AGENT_PLANS, getPlanByPriceId } from "@/lib/billing-config";
import { SubscriptionActions } from "@/components/billing/SubscriptionActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CreditCard, Calendar, AlertCircle, CheckCircle2 } from "lucide-react";
import type { BillingRole } from "@/lib/billing-config";
import { formatGBP, formatDate } from "@/lib/formatters";

type SubscriptionRow = {
  status: string;
  plan_name: string | null;
  price_amount: number | null;
  currency: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  role: string | null;
  stripe_subscription_id: string | null;
};

export default async function SubscriptionPage({
  params,
}: Readonly<{ params: Promise<{ role: string }> }>) {
  const { role } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, plan_name, price_amount, currency, current_period_end, cancel_at_period_end, role, stripe_subscription_id")
    .eq("user_id", user.id)
    .maybeSingle<SubscriptionRow>();

  const billingRole = (["agent", "landlord", "provider"].includes(role) ? role : "agent") as BillingRole;
  const plans = PLANS_BY_ROLE[billingRole] ?? AGENT_PLANS;
  const hasActivePlan = subscription && (subscription.status === "active" || subscription.status === "trialing");
  const basePath = `/dashboard/${role}/billing`;

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={basePath}><ArrowLeft size={16} /></Link>
        </Button>
        <div>
          <h1 className="font-heading text-xl font-semibold text-foreground">
            Manage Subscription
          </h1>
          <p className="font-body text-sm text-neutral-500">
            View, upgrade, downgrade, or cancel your plan
          </p>
        </div>
      </div>

      {!hasActivePlan ? (
        <div className="rounded-xl bg-warning-light p-6 text-center ring-1 ring-warning/20 dark:bg-warning/10 dark:ring-warning/30">
          <AlertCircle className="mx-auto mb-3 text-warning" size={32} />
          <p className="font-heading text-base font-semibold text-foreground">No active subscription</p>
          <p className="mt-1 font-body text-sm text-neutral-500">
            Subscribe to unlock Britestate&apos;s full feature set.
          </p>
          <Button className="mt-4 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-primary/90" asChild>
            <Link href={`${basePath}/checkout/subscription`}>Choose a plan</Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Current plan details */}
          <div className="rounded-xl bg-card shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
            <div className="flex items-center justify-between border-b border-neutral-100/60 p-6 dark:border-neutral-700/60">
              <span className="flex items-center gap-2 font-heading text-base font-semibold text-foreground">
                <CreditCard size={16} className="text-brand-primary" />
                Current Plan
              </span>
              <Badge className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                subscription.status === "active"
                  ? "bg-brand-primary-lighter text-brand-primary"
                  : subscription.status === "past_due"
                  ? "bg-warning-light text-warning dark:bg-warning/20 dark:text-warning"
                  : "bg-brand-accent-light text-brand-accent dark:bg-brand-accent/20 dark:text-brand-accent"
              }`}>
                {subscription.status.replace("_", " ")}
              </Badge>
            </div>
            <div className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                  <p className="font-body text-xs text-neutral-500">Plan</p>
                  <p className="font-heading text-sm font-semibold text-foreground">
                    {subscription.plan_name ?? "Britestate Plan"}
                  </p>
                </div>
                <div>
                  <p className="font-body text-xs text-neutral-500">Price</p>
                  <p className="font-heading text-sm font-semibold text-foreground">
                    {subscription.price_amount
                      ? `${formatGBP(subscription.price_amount, subscription.currency)}/mo`
                      : "—"}
                  </p>
                </div>
                {subscription.current_period_end && (
                  <div>
                    <p className="font-body text-xs text-neutral-500">
                      {subscription.cancel_at_period_end ? "Cancels on" : "Next renewal"}
                    </p>
                    <p className={`flex items-center gap-1 font-heading text-sm font-semibold ${subscription.cancel_at_period_end ? "text-warning" : "text-foreground"}`}>
                      <Calendar size={13} />
                      {formatDate(subscription.current_period_end)}
                    </p>
                  </div>
                )}
              </div>

              {subscription.cancel_at_period_end && (
                <div className="rounded-lg bg-warning-light p-3 text-sm text-warning ring-1 ring-warning/20 dark:bg-warning/10 dark:text-warning dark:ring-warning/30">
                  Your subscription is set to cancel at the end of the current period. You can reactivate it at any time.
                </div>
              )}

              <SubscriptionActions
                role={role}
                basePath={basePath}
                returnUrl={`${basePath}/subscription`}
              />
            </div>
          </div>

          {/* Available plans for upgrade */}
          <div className="space-y-4">
            <h2 className="font-heading text-base font-semibold text-foreground">
              Available Plans
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => {
                const isCurrent = plan.name === subscription.plan_name;
                return (
                  <div key={plan.id} className={`relative rounded-xl bg-card shadow-sm ring-1 transition-all hover:shadow-md ${isCurrent ? "ring-brand-primary" : "ring-neutral-200/60 dark:ring-neutral-700/60"}`}>
                    {isCurrent && (
                      <div className="absolute -top-2.5 left-4">
                        <Badge className="inline-flex items-center rounded-full bg-brand-primary px-2.5 py-0.5 text-xs font-medium text-white">Current</Badge>
                      </div>
                    )}
                    <div className="pb-4 pt-6 px-6">
                      <p className="font-heading text-sm font-semibold text-foreground">{plan.name}</p>
                      <p className="mt-1 font-heading text-2xl font-bold text-foreground">
                        {formatGBP(plan.priceMonthly)}
                        <span className="font-body text-sm font-normal text-neutral-500">/mo</span>
                      </p>
                      <ul className="mt-3 space-y-1.5">
                        {plan.features.slice(0, 3).map((f) => (
                          <li key={f} className="flex items-start gap-1.5 font-body text-xs text-neutral-500">
                            <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-brand-primary" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="font-body text-xs text-neutral-500">
              To change plans, use the Stripe portal below.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
