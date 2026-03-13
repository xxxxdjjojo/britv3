import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AgencyBrandingForm } from "@/components/dashboard/agent/AgencyBrandingForm";
import type { AgentAgencyProfile } from "@/types/agent";

export default async function AgencyBrandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("agent_agency_profiles")
    .select("*")
    .eq("agent_id", user.id)
    .maybeSingle();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Agency Branding
        </h1>
        <p className="text-sm text-muted-foreground">
          Customise your logo, brand colours, and social links.
        </p>
      </div>
      <AgencyBrandingForm profile={profile as AgentAgencyProfile | null} />
    </div>
  );
}
