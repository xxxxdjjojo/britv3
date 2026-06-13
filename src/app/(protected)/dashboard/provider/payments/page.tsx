import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CreditCard } from "lucide-react";
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
      <div className="p-6 max-w-7xl">
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-surface py-20 text-center">
          <CreditCard className="size-12 text-neutral-300" />
          <h2 className="mt-4 text-lg font-semibold text-neutral-700">
            Payments coming soon
          </h2>
          <p className="mt-2 text-sm text-neutral-500 max-w-sm">
            Payment processing via Stripe Connect is being configured. Check back
            shortly.
          </p>
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
      <div className="p-6 space-y-6 max-w-7xl">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Payments</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage your earnings and payouts.
          </p>
        </div>
        <StripeConnectOnboarding />
      </div>
    );
  }

  // ── Connected — fetch balance + payout history in parallel ───────────────
  const [balance, payouts] = await Promise.all([
    getStripeBalance(providerId, supabase),
    getPayoutHistory(providerId, 20, supabase),
  ]);

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Payments</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Your earnings, balances, and payout history.
        </p>
      </div>

      <PaymentsOverview balance={balance} payouts={payouts} />
    </div>
  );
}
