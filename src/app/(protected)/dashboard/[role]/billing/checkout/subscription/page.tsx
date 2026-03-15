// Subscription checkout — plan selection page
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PLANS_BY_ROLE, AGENT_PLANS } from "@/lib/billing-config";
import { PlanGrid } from "@/components/billing/PlanGrid";
import type { BillingRole } from "@/lib/billing-config";

export default async function SubscriptionCheckoutPage({
  params,
}: Readonly<{ params: Promise<{ role: string }> }>) {
  const { role } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Check if already subscribed
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle<{ status: string }>();

  const billingRole = (["agent", "landlord", "provider"].includes(role)
    ? role
    : "agent") as BillingRole;

  const plans = PLANS_BY_ROLE[billingRole] ?? AGENT_PLANS;
  const isAlreadySubscribed =
    subscription && (subscription.status === "active" || subscription.status === "trialing");

  const cancelUrl = `/dashboard/${role}/billing`;
  const successUrl = `/dashboard/${role}/billing/confirmation?plan={PLAN_NAME}&amount={AMOUNT}&session_id={CHECKOUT_SESSION_ID}`;

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
          Choose your plan
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          All plans include a 14-day refund guarantee. Cancel anytime.
        </p>
      </div>

      {isAlreadySubscribed && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
          You already have an active subscription. Visit{" "}
          <a href={`/dashboard/${role}/billing/subscription`} className="underline">
            Manage Subscription
          </a>{" "}
          to upgrade or change your plan.
        </div>
      )}

      <PlanGrid
        plans={plans as Parameters<typeof PlanGrid>[0]["plans"]}
        role={billingRole}
        cancelUrl={cancelUrl}
        successUrl={successUrl}
        disabled={!!isAlreadySubscribed}
      />

      <p className="text-center text-xs text-gray-400 dark:text-gray-600">
        A 2.5% platform commission applies on sales transactions. All billing is managed securely via Stripe.
      </p>
    </div>
  );
}
