import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveBoosts } from "@/services/provider/provider-boost-service";
import { BoostSelector } from "@/components/dashboard/provider/BoostSelector";

export const metadata = { title: "Boost & Promote — Provider Dashboard" };

export default async function BoostPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const stripeEnabled = process.env.FEATURE_STRIPE_CONNECT_ENABLED === "true";

  const { data: providerProfile } = await supabase
    .from("service_provider_details")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!providerProfile) {
    redirect("/dashboard/provider");
  }

  let activeBoosts = [];
  try {
    activeBoosts = await getActiveBoosts(supabase, providerProfile.id);
  } catch {
    activeBoosts = [];
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Boost &amp; Promote</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Increase your visibility and win more jobs with targeted promotions.
        </p>
      </div>

      <BoostSelector activeBoosts={activeBoosts} stripeEnabled={stripeEnabled} />
    </div>
  );
}
