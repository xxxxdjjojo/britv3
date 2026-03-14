import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AgencyProfileForm } from "@/components/dashboard/agent/AgencyProfileForm";
import type { AgentAgencyProfile } from "@/types/agent";

export default async function AgencyProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("agent_agency_profiles")
    .select("*")
    .eq("agent_id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Agency Profile
        </h1>
        <p className="text-sm text-muted-foreground">
          Update your agency&apos;s contact details, specializations, and coverage
          areas.
        </p>
      </div>
      <AgencyProfileForm profile={profile as AgentAgencyProfile | null} />
    </div>
  );
}
