import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AgencyProfileForm } from "@/components/dashboard/agent/AgencyProfileForm";
import type { AgentAgencyProfile } from "@/types/agent";

export default async function AgencyProfilePage() {
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
          Agency Profile
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your agency details and contact information.
        </p>
      </div>
      <AgencyProfileForm profile={profile as AgentAgencyProfile | null} />
    </div>
  );
}
