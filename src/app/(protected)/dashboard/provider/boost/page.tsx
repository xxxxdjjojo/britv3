import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { canPurchaseBoost, type SubscriptionStatus, type VerificationStatus } from "@/lib/placements/eligibility";
import { BoostMyProfile } from "@/components/dashboard/provider/BoostMyProfile";

export const metadata = { title: "Boost My Profile — Provider Dashboard" };

export default async function BoostPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: providerProfile } = await supabase
    .from("service_provider_details")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!providerProfile) redirect("/dashboard/provider");

  const [{ data: profile }, { data: sub }] = await Promise.all([
    supabase.from("profiles").select("provider_verification_status").eq("id", user.id).maybeSingle(),
    supabase.from("subscriptions").select("status").eq("user_id", user.id).maybeSingle(),
  ]);

  const verificationStatus = (profile?.provider_verification_status ?? "unverified") as VerificationStatus;
  const subscriptionStatus = (sub?.status ?? "inactive") as SubscriptionStatus;
  const eligibility = canPurchaseBoost({ verificationStatus, subscriptionStatus });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Boost My Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pay for premium visibility exactly where property customers are making decisions — property pages, search and
          your local area.
        </p>
      </header>

      <BoostMyProfile eligibility={eligibility} />
    </div>
  );
}
