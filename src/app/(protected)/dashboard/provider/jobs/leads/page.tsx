import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getProviderLeads } from "@/services/provider/provider-job-service";
import { JobLeadsClient } from "@/components/dashboard/provider/JobLeadsClient";

export const metadata = { title: "Job Leads — Provider Dashboard" };

export default async function ProviderLeadsPage() {
  try {
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
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const providerId = providerProfile?.user_id ?? user.id;

  // Fetch initial leads server-side
  const leads = await getProviderLeads(providerId, supabase);

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold font-heading text-brand-primary tracking-tight">
            Marketplace Opportunities
          </h1>
          <p className="text-neutral-500 text-sm">
            Leads filtered by your skills and service area. Leads expire after 48 hours.
          </p>
        </div>
      </div>

      <JobLeadsClient initialLeads={leads} providerId={providerId} />
    </div>
    );
  } catch (error) {
    if (error instanceof Error && "digest" in error) throw error;
    return (
      <div className="p-6 lg:p-10 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold font-heading text-brand-primary">Marketplace Opportunities</h1>
        <p className="mt-4 text-sm text-neutral-500">Unable to load leads. Please try refreshing the page.</p>
      </div>
    );
  }
}
