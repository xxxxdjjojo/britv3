import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SubscriptionBilling } from "@/components/dashboard/provider/SubscriptionBilling";

export const metadata = { title: "Billing & Earnings — Provider Dashboard" };

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
    <div className="min-h-screen bg-[#faf9f8] p-10">
      <div className="max-w-7xl mx-auto">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-10">
          <div>
            <nav className="flex text-xs text-stone-500 mb-2 gap-2">
              <span>Dashboard</span>
              <span>/</span>
              <span className="text-emerald-700 font-medium">
                Billing &amp; Earnings
              </span>
            </nav>
            <h1 className="text-3xl font-extrabold text-stone-950 font-heading tracking-tight">
              Billing &amp; Earnings
            </h1>
            <p className="text-stone-500 mt-1 text-sm">
              Manage your professional payouts and financial documents.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="px-5 py-2.5 bg-white border border-stone-200 rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-stone-50 transition-colors shadow-sm text-stone-700">
              <svg
                className="size-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
              Export Statement
            </button>
            <button className="px-5 py-2.5 bg-[#003629] text-white rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-[#1b4d3e] transition-colors shadow-md">
              <svg
                className="size-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"
                />
              </svg>
              Invoice Generator
            </button>
          </div>
        </div>

        <SubscriptionBilling
          currentPlanId={currentPlanId}
          renewalDate={renewalDate}
          stripeEnabled={stripeEnabled}
        />
      </div>
    </div>
  );
}
