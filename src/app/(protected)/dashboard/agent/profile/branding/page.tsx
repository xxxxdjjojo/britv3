import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AgencyBrandingForm } from "@/components/dashboard/agent/AgencyBrandingForm";
import type { AgentAgencyProfile } from "@/types/agent";

export default async function AgencyBrandingPage() {
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
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
          Agent Profile
        </p>
        <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-brand-primary-dark mt-1">
          Agency Branding
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Customise your logo, brand colours, and social media links.
        </p>
      </div>
      <AgencyBrandingForm profile={profile as AgentAgencyProfile | null} />
    </div>
  );
}
