import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SubscriptionBilling } from "@/components/dashboard/provider/SubscriptionBilling";

export const metadata = { title: "Subscription & Billing — Provider Dashboard" };

export default async function BillingPage() {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // ── Feature flag ──────────────────────────────────────────────────────────
  const stripeEnabled =
    process.env.FEATURE_STRIPE_CONNECT_ENABLED === "true";

  // ── Resolve subscription plan from provider profile ──────────────────────
  // The subscription_plan column is expected on service_provider_details.
  // Until real billing is wired, it defaults to "free".
  const { data: providerProfile } = await supabase
    .from("service_provider_details")
    .select("subscription_plan, subscription_renewal_date")
    .eq("user_id", user.id)
    .maybeSingle();

  type PlanId = "free" | "starter" | "professional" | "premium";

  const currentPlanId =
    ((providerProfile as { subscription_plan: string | null } | null)
      ?.subscription_plan as PlanId | null) ?? "free";

  const renewalDate =
    (
      providerProfile as {
        subscription_renewal_date: string | null;
      } | null
    )?.subscription_renewal_date ?? null;

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">
          Subscription &amp; Billing
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Manage your plan, payment method, and billing history.
        </p>
      </div>

      <SubscriptionBilling
        currentPlanId={currentPlanId}
        renewalDate={renewalDate}
        stripeEnabled={stripeEnabled}
      />
    </div>
  );
}
