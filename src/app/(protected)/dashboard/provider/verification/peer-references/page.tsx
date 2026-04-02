import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProviderReferences } from "@/services/provider/provider-verification-service";
import { ReferenceTracker } from "@/components/dashboard/provider/ReferenceTracker";

export const metadata = {
  title: "Peer References | Provider Dashboard",
};

export default async function PeerReferencesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: providerProfile } = await supabase
    .from("service_provider_details")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const providerId = providerProfile?.user_id ?? user.id;

  const references = await getProviderReferences(supabase, providerId, "peer").catch(() => []);

  return (
    <div className="space-y-8 p-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Peer References</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Request references from fellow tradespeople and industry peers. Peer endorsements
          strengthen your professional credibility.
        </p>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <ReferenceTracker
          references={references}
          referenceType="peer"
          providerId={providerId}
        />
      </div>
    </div>
  );
}
