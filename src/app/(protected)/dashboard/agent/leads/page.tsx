import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgentLeads } from "@/services/agent/agent-lead-service";
import { LeadPipelineKanban } from "@/components/dashboard/agent/leads/LeadPipelineKanban";
import type { AgentLead, LeadStage } from "@/types/agent";

export const metadata = {
  title: "Leads & Pipeline | Agent",
};

export default async function AgentLeadsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let leads: AgentLead[] = [];

  try {
    leads = await getAgentLeads(supabase, user.id);
  } catch {
    // Service call failed — render an empty board
  }

  const grouped = leads.reduce(
    (acc, lead) => {
      acc[lead.stage] = [...(acc[lead.stage] ?? []), lead];
      return acc;
    },
    {} as Record<string, AgentLead[]>,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leads & Pipeline</h1>
        <p className="text-muted-foreground">
          Manage client enquiries and track your sales pipeline
        </p>
      </div>

      <LeadPipelineKanban
        initialLeads={grouped as Partial<Record<LeadStage, AgentLead[]>>}
      />
    </div>
  );
}
