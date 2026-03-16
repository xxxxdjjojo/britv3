import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getProviderLeads } from "@/services/provider/provider-job-service";
import { JobLeadsClient } from "@/components/dashboard/provider/JobLeadsClient";

export const metadata = { title: "New Leads — Provider Dashboard" };

export default async function ProviderLeadsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Resolve provider id
  const { data: providerProfile } = await supabase
    .from("service_provider_details")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const providerId = providerProfile?.id ?? user.id;

  // Fetch initial leads server-side
  const leads = await getProviderLeads(providerId, supabase);

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">New Leads</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Open service requests matching your categories. Leads expire after 48 hours.
        </p>
      </div>

      <JobLeadsClient initialLeads={leads} providerId={providerId} />
    </div>
  );
}
