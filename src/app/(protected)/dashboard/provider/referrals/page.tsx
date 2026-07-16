import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getReferralDashboard } from "@/services/referrals/unified-referral-service";
import { ReferralDashboard } from "@/components/referrals/ReferralDashboard";

export const metadata = { title: "Bring Your Crew — TrueDeed" };

export default async function ProviderReferralsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const stats = await getReferralDashboard(supabase, user.id, { providerOnly: true });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Provider referrals</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Track every invitation from signup through to your subscription credit.
        </p>
      </div>

      <ReferralDashboard stats={stats} providerOnly />
    </div>
  );
}
