import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProviderReferences } from "@/services/provider/provider-verification-service";
import { getVouchRules } from "@/services/provider/vouch-rules-service";
import { ReferenceTracker } from "@/components/dashboard/provider/ReferenceTracker";

export const metadata = {
  title: "Client References | Provider Dashboard",
};

export default async function ClientReferencesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // provider_id is service_provider_details.user_id = the auth user's id.
  // (service_provider_details has no `id` column, so the old lookup was dead.)
  const providerId = user.id;

  const [references, rules] = await Promise.all([
    getProviderReferences(supabase, providerId, "client").catch(() => []),
    getVouchRules(supabase),
  ]);

  return (
    <div className="space-y-8 p-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Client References</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Request references from past clients to build trust with future customers. Aim for at
          least {rules.required_client_vouches} verified references.
        </p>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <ReferenceTracker
          references={references}
          referenceType="client"
          requiredCount={rules.required_client_vouches}
          recencyDays={rules.client_recency_days}
        />
      </div>
    </div>
  );
}
