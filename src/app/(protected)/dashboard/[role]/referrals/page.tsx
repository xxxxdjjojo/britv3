import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getReferralDashboard } from "@/services/referrals/unified-referral-service";
import { ReferralDashboard } from "@/components/referrals/ReferralDashboard";

export const metadata = { title: "Referral Programme — Britestate" };

export default async function ReferralsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let stats;
  try {
    stats = await getReferralDashboard(supabase, user.id);
  } catch (error) {
    if (error instanceof Error && "digest" in error) throw error;
    stats = {
      referral_code: "",
      referral_url: "",
      tier: "none" as const,
      successful_referrals: 0,
      pending_referrals: 0,
      total_rewards_pence: 0,
      next_tier_threshold: null,
      referrals: [],
    };
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface">Referral Programme</h1>
        <p className="mt-1 text-sm text-[--color-on-surface-variant]">
          Invite quality tradespeople to Britestate. Earn free months for every successful referral.
        </p>
      </div>

      <ReferralDashboard stats={stats} />
    </div>
  );
}
