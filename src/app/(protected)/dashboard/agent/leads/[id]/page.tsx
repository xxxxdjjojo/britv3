import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getLeadById,
  getLeadActivities,
} from "@/services/agent/agent-lead-service";
import { getTeamMembers } from "@/services/agent/agent-team-service";
import { LeadDetailTimeline } from "@/components/dashboard/agent/leads/LeadDetailTimeline";
import type { AgentLead, AgentLeadActivity, AgentTeamMember } from "@/types/agent";

export const metadata = {
  title: "Lead Detail | Agent",
};

type Props = Readonly<{
  params: Promise<{ id: string }>;
}>;

export default async function AgentLeadDetailPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let lead: AgentLead;
  let activities: AgentLeadActivity[] = [];
  let teamMembers: AgentTeamMember[] = [];

  try {
    lead = await getLeadById(supabase, id, user.id);
  } catch {
    notFound();
  }

  try {
    [activities, teamMembers] = await Promise.all([
      getLeadActivities(supabase, id),
      getTeamMembers(supabase, user.id),
    ]);
  } catch {
    // Fall through with empty arrays — page still renders
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {lead!.contact_name}
        </h1>
        <p className="text-muted-foreground">Lead detail and activity log</p>
      </div>

      <LeadDetailTimeline
        lead={lead!}
        activities={activities}
        teamMembers={teamMembers}
        userId={user.id}
      />
    </div>
  );
}
