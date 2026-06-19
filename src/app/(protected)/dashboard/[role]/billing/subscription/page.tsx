import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PLANS_BY_ROLE, AGENT_PLANS, getPlanByPriceId } from "@/lib/billing-config";
import { SubscriptionActions } from "@/components/billing/SubscriptionActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
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
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      {/* Page header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="sm" asChild className="mt-1 shrink-0">
          <Link href={basePath}><ArrowLeft size={16} /></Link>
        </Button>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
            Billing
          </p>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-brand-primary-dark md:text-4xl">
            Manage Subscription
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            View, upgrade, downgrade, or cancel your plan
          </p>
        </div>
      </div>

      {!hasActivePlan ? (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-8 text-center dark:border-orange-800 dark:bg-orange-950">
          <AlertCircle className="mx-auto mb-3 text-orange-500" size={32} />
          <p className="font-semibold text-orange-900 dark:text-orange-100">No active subscription</p>
          <p className="mt-1 text-sm text-orange-700 dark:text-orange-300">
            Subscribe to unlock TrueDeed&apos;s full feature set.
          </p>
          <Button className="mt-4 bg-brand-primary text-white hover:bg-brand-primary-light" asChild>
            <Link href={`${basePath}/checkout/subscription`}>Choose a plan</Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Two-column: plan details + manage actions */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Current plan card — spans 2 cols */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
                    Current Plan
                  </span>
                  <Badge
                    className={
                      subscription.status === "active"
                        ? "bg-success/10 text-success border-0"
                        : subscription.status === "past_due"
                        ? "bg-warning/10 text-warning border-0"
                        : subscription.status === "trialing"
                        ? "bg-blue-100 text-blue-800 border-0 dark:bg-blue-900 dark:text-blue-200"
                        : "bg-neutral-100 text-neutral-600 border-0"
                    }
                  >
                    {subscription.status.replace("_", " ")}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Plan name prominent */}
                <div>
                  <p className="text-xs text-neutral-400">Plan</p>
                  <p className="font-heading text-2xl font-bold text-brand-primary-dark">
                    {subscription.plan_name ?? "TrueDeed Plan"}
                  </p>
                </div>

                {/* Key stats row */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                      Price
                    </p>
                    <p className="mt-1 text-lg font-bold text-neutral-900 dark:text-neutral-100">
                      {subscription.price_amount
                        ? `${formatGBP(subscription.price_amount, subscription.currency)}/mo`
                        : "—"}
                    </p>
                  </div>
                  {subscription.current_period_end && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                        {subscription.cancel_at_period_end ? "Cancels on" : "Next renewal"}
                      </p>
                      <p
                        className={`mt-1 text-lg font-bold ${
                          subscription.cancel_at_period_end
                            ? "text-warning"
                            : "text-neutral-900 dark:text-neutral-100"
                        }`}
                      >
                        {formatDate(subscription.current_period_end)}
                      </p>
                    </div>
                  )}
                </div>

                {subscription.cancel_at_period_end && (
                  <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200">
                    Your subscription is set to cancel at the end of the current period. You can reactivate it at any time.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Manage / portal actions — right column */}
            <Card className="flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle>
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
                    Manage
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-4">
                <p className="text-sm text-neutral-500">
                  Upgrade, downgrade, cancel, or update payment via Stripe
                </p>
                <SubscriptionActions
                  role={role}
                  basePath={basePath}
                  returnUrl={`${basePath}/subscription`}
                />
              </CardContent>
            </Card>
          </div>

          {/* Available plans */}
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
                Plans
              </p>
              <h2 className="font-heading text-xl font-bold tracking-tight text-brand-primary-dark">
                Available Plans
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => {
                const isCurrent = plan.name === subscription.plan_name;
                return (
                  <Card
                    key={plan.id}
                    className={`relative transition-shadow ${
                      isCurrent
                        ? "border-brand-primary shadow-sm ring-1 ring-brand-primary/20"
                        : "hover:shadow-sm"
                    }`}
                  >
                    {isCurrent && (
                      <div className="absolute -top-2.5 left-4">
                        <Badge className="bg-brand-primary text-white text-xs border-0">Current</Badge>
                      </div>
                    )}
                    <CardContent className="pb-4 pt-6">
                      <p className="font-heading font-bold text-neutral-900 dark:text-neutral-100">
                        {plan.name}
                      </p>
                      <p className="mt-1 text-2xl font-bold text-brand-primary-dark">
                        {formatGBP(plan.priceMonthly)}
                        <span className="text-sm font-normal text-neutral-400">/mo</span>
                      </p>
                      <ul className="mt-3 space-y-1.5">
                        {plan.features.slice(0, 3).map((f) => (
                          <li key={f} className="flex items-start gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                            <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-success" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <p className="text-xs text-neutral-400">
              To change plans, use the Stripe portal below.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
