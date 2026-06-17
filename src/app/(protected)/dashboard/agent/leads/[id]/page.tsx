import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  getLeadById,
  getLeadActivities,
} from "@/services/agent/agent-lead-service";
import { getTeamMembers } from "@/services/agent/agent-team-service";
import { LeadDetailTimeline } from "@/components/dashboard/agent/leads/LeadDetailTimeline";
import { Button } from "@/components/ui/button";
import type { AgentLead, AgentLeadActivity, AgentTeamMember } from "@/types/agent";

export const metadata = {
  title: "Lead Detail | Agent | Britestate",
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
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link href="/dashboard/agent/leads" aria-label="Back to leads">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
              Lead detail and activity log
            </p>
            <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-brand-primary-dark mt-1">
              {lead!.contact_name}
            </h1>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0 pt-1">
          {lead!.contact_email && (
            <Button variant="outline" size="sm" asChild>
              <a href={`mailto:${lead!.contact_email}`}>
                <Mail className="mr-2 size-4" />
                Send Message
              </a>
            </Button>
          )}
        </div>
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
