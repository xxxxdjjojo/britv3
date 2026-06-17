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
    <div className="p-6 md:p-8 space-y-6 max-w-7xl">
      {/* Page header — editorial pattern */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400 mb-1">
          Job Leads
        </p>
        <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-brand-primary-dark">
          New Leads
        </h1>
        <p className="mt-1.5 text-sm text-neutral-500">
          Open service requests matching your categories. Leads expire after 48 hours.
        </p>
      </div>

      <JobLeadsClient initialLeads={leads} providerId={providerId} />
    </div>
  );
}
