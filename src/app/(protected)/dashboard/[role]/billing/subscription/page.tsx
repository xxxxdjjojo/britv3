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
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={basePath}><ArrowLeft size={16} /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
            Manage Subscription
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            View, upgrade, downgrade, or cancel your plan
          </p>
        </div>
      </div>

      {!hasActivePlan ? (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-6 text-center dark:border-orange-800 dark:bg-orange-950">
          <AlertCircle className="mx-auto mb-3 text-orange-500" size={32} />
          <p className="font-semibold text-orange-900 dark:text-orange-100">No active subscription</p>
          <p className="mt-1 text-sm text-orange-700 dark:text-orange-300">
            Subscribe to unlock Britestate&apos;s full feature set.
          </p>
          <Button className="mt-4 bg-[#1B4D3E] text-white hover:bg-[#2D7A5F]" asChild>
            <Link href={`${basePath}/checkout/subscription`}>Choose a plan</Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Current plan details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <CreditCard size={16} className="text-[#1B4D3E]" />
                  Current Plan
                </span>
                <Badge className={
                  subscription.status === "active"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : subscription.status === "past_due"
                    ? "bg-orange-100 text-orange-800"
                    : "bg-blue-100 text-blue-800"
                }>
                  {subscription.status.replace("_", " ")}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-gray-500">Plan</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {subscription.plan_name ?? "Britestate Plan"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Price</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {subscription.price_amount
                      ? `${formatGBP(subscription.price_amount, subscription.currency)}/mo`
                      : "—"}
                  </p>
                </div>
                {subscription.current_period_end && (
                  <div>
                    <p className="text-xs text-gray-500">
                      {subscription.cancel_at_period_end ? "Cancels on" : "Next renewal"}
                    </p>
                    <p className={`font-semibold flex items-center gap-1 ${subscription.cancel_at_period_end ? "text-orange-600" : "text-gray-900 dark:text-gray-100"}`}>
                      <Calendar size={13} />
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

              <SubscriptionActions
                role={role}
                basePath={basePath}
                returnUrl={`${basePath}/subscription`}
              />
            </CardContent>
          </Card>

          {/* Available plans for upgrade */}
          <div>
            <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
              Available Plans
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => {
                const isCurrent = plan.name === subscription.plan_name;
                return (
                  <Card key={plan.id} className={`relative ${isCurrent ? "border-[#1B4D3E] ring-1 ring-[#1B4D3E]/20" : ""}`}>
                    {isCurrent && (
                      <div className="absolute -top-2.5 left-4">
                        <Badge className="bg-[#1B4D3E] text-white text-xs">Current</Badge>
                      </div>
                    )}
                    <CardContent className="pt-6 pb-4">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{plan.name}</p>
                      <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {formatGBP(plan.priceMonthly)}
                        <span className="text-sm font-normal text-gray-500">/mo</span>
                      </p>
                      <ul className="mt-3 space-y-1.5">
                        {plan.features.slice(0, 3).map((f) => (
                          <li key={f} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                            <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-[#1B4D3E]" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-gray-400">
              To change plans, use the Stripe portal below.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
