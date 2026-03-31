import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  getStripeConnectAccount,
  getStripeBalance,
  getPayoutHistory,
} from "@/services/provider/provider-payment-service";
import { StripeConnectOnboarding } from "@/components/dashboard/provider/StripeConnectOnboarding";
import { PaymentsOverview } from "@/components/dashboard/provider/PaymentsOverview";

export const metadata = { title: "Payments — Provider Dashboard" };

export default async function PaymentsPage() {
  // ── Feature flag ─────────────────────────────────────────────────────────
  if (process.env.FEATURE_STRIPE_CONNECT_ENABLED !== "true") {
    return (
      <div className="min-h-screen bg-[#faf9f8] p-10">
        <div className="max-w-7xl mx-auto">
          {/* Page header */}
          <div className="mb-10">
            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#7b5804] mb-2 block">
              Provider Dashboard
            </span>
            <h1 className="text-4xl font-extrabold text-stone-900 font-heading tracking-tight">
              Financial Health
            </h1>
          </div>

          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-white py-24 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
              <svg
                className="size-8 text-stone-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"
                />
              </svg>
            </div>
            <h2 className="font-heading text-lg font-bold text-stone-800 mb-2">
              Payments coming soon
            </h2>
            <p className="max-w-sm text-sm text-stone-500">
              Payment processing via Stripe Connect is being configured. Check
              back shortly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // ── Resolve provider id ───────────────────────────────────────────────────
  const { data: providerProfile } = await supabase
    .from("service_provider_details")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const providerId = (providerProfile as { id: string } | null)?.id ?? user.id;

  // ── Stripe Connect account status ─────────────────────────────────────────
  const connectAccount = await getStripeConnectAccount(supabase, providerId);

  const isOnboarded =
    connectAccount !== null &&
    connectAccount.onboarding_complete &&
    connectAccount.charges_enabled;

  // ── Not connected — show onboarding banner ───────────────────────────────
  if (!isOnboarded) {
    return (
      <div className="min-h-screen bg-[#faf9f8] p-10">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#7b5804] mb-2 block">
              Provider Dashboard
            </span>
            <h1 className="text-4xl font-extrabold text-stone-900 font-heading tracking-tight">
              Financial Health
            </h1>
          </div>
          <StripeConnectOnboarding />
        </div>
      </div>
    );
  }

  // ── Connected — fetch balance + payout history in parallel ───────────────
  const [balance, payouts] = await Promise.all([
    getStripeBalance(providerId, supabase),
    getPayoutHistory(providerId, 20, supabase),
  ]);

  return (
    <div className="min-h-screen bg-[#faf9f8] p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page header */}
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#7b5804] mb-2 block">
            Provider Dashboard
          </span>
          <h1 className="text-4xl font-extrabold text-stone-900 font-heading tracking-tight">
            Financial Health
          </h1>
        </div>

        <PaymentsOverview balance={balance} payouts={payouts} />
      </div>
    </div>
  );
}
