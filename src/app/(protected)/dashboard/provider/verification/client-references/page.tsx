import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProviderReferences } from "@/services/provider/provider-verification-service";
import { ReferenceTracker } from "@/components/dashboard/provider/ReferenceTracker";

export const metadata = {
  title: "Client References | Provider Dashboard",
};

export default async function ClientReferencesPage() {
  try {
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

  const references = await getProviderReferences(supabase, providerId, "client").catch(() => []);

  return (
    <div className="space-y-8 p-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Client References</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Request references from past clients to build trust with future customers. Aim for at
          least 3 verified references.
        </p>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <ReferenceTracker
          references={references}
          referenceType="client"
          providerId={providerId}
        />
      </div>
    </div>
    );
  } catch (error) {
    if (error instanceof Error && "digest" in error) throw error;
    return (
      <div className="space-y-8 p-6 max-w-3xl">
        <h1 className="text-2xl font-bold text-neutral-900">Client References</h1>
        <p className="mt-4 text-sm text-neutral-500">Unable to load references. Please try refreshing the page.</p>
      </div>
    );
  }
}
