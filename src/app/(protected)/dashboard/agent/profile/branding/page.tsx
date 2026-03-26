import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AgencyBrandingForm } from "@/components/dashboard/agent/AgencyBrandingForm";
import type { AgentAgencyProfile } from "@/types/agent";
import { Skeleton } from "@/components/ui/skeleton";


function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64 mt-2" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

async function PageContent() {
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
          Agency Branding
        </h1>
        <p className="text-sm text-muted-foreground">
          Customise your logo, brand colours, and social media links.
        </p>
      </div>
      <AgencyBrandingForm profile={profile as AgentAgencyProfile | null} />
    </div>
  );
}

export default function AgencyBrandingPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageContent />
    </Suspense>
  );
}
