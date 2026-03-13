import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgentLeads } from "@/services/agent/agent-lead-service";
import { LeadPipelineKanban } from "@/components/dashboard/agent/leads/LeadPipelineKanban";
import { LEAD_STAGES } from "@/types/agent";
import type { AgentLead, LeadStage } from "@/types/agent";

export default async function LeadsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let leads: AgentLead[] = [];
  try {
    leads = await getAgentLeads(supabase, user.id);
  } catch {
    leads = [];
  }

  // Group leads by stage
  const grouped = {} as Record<LeadStage, AgentLead[]>;
  for (const stage of LEAD_STAGES) {
    grouped[stage] = [];
  }
  for (const lead of leads) {
    if (grouped[lead.stage]) {
      grouped[lead.stage].push(lead);
    }
  }

  return <LeadPipelineKanban initialLeads={grouped} />;
}
