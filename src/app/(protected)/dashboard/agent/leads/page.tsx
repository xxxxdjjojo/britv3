import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { captureException } from "@/lib/observability/capture-exception";
import { getAgentLeads } from "@/services/agent/agent-lead-service";
import { LeadPipelineKanban } from "@/components/dashboard/agent/leads/LeadPipelineKanban";
import type { AgentLead, LeadStage } from "@/types/agent";

export const metadata = {
  title: "Leads & Pipeline | Agent | TrueDeed",
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
  } catch (error) {
    captureException(error, {
      module: "dashboard",
      feature: "agent",
      route: "/dashboard/agent/leads",
      operation: "getAgentLeads",
    });
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
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
          Pipeline
        </p>
        <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-brand-primary-dark mt-1">
          Leads &amp; Pipeline
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage client enquiries and track your sales pipeline
        </p>
      </div>

      <LeadPipelineKanban
        initialLeads={grouped as Partial<Record<LeadStage, AgentLead[]>>}
      />
    </div>
  );
}
