import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getReferralCode,
  getReferralStats,
  getReferrals,
} from "@/services/provider/provider-referral-service";
import { ReferralCard } from "@/components/dashboard/provider/ReferralCard";

export const metadata = { title: "Referral Programme — Provider Dashboard" };

export default async function ReferralsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: providerProfile } = await supabase
    .from("service_provider_details")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!providerProfile) {
    redirect("/dashboard/provider");
  }

  const providerId: string = providerProfile.id;

  const [referralCode, stats, referrals] = await Promise.all([
    getReferralCode(supabase, providerId),
    getReferralStats(supabase, providerId),
    getReferrals(supabase, providerId),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Referral Programme</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Invite other tradespeople to Britestate and earn £50 for each verified sign-up.
        </p>
      </div>

      <ReferralCard
        referralCode={referralCode}
        stats={stats}
        referrals={referrals}
      />
    </div>
  );
}
