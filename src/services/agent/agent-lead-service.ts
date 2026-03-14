/**
 * Agent lead service -- CRM lead management including stage progression,
 * assignment, and activity logging.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AgentLead,
  AgentLeadActivity,
  LeadStage,
  CreateLeadInput,
} from "@/types/agent";

/**
 * Returns all leads for the given agent, optionally filtered by stage.
 * Ordered by updated_at descending so the most recently active leads appear
 * first.
 */
export async function getAgentLeads(
  supabase: SupabaseClient,
  agentId: string,
  stage?: LeadStage,
): Promise<AgentLead[]> {
  let query = supabase
    .from("agent_leads")
    .select("*")
    .eq("agent_id", agentId)
    .order("updated_at", { ascending: false });

  if (stage) {
    query = query.eq("stage", stage);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as AgentLead[];
}

/**
 * Fetches a single lead by ID, verifying it belongs to the given agent.
 */
export async function getLeadById(
  supabase: SupabaseClient,
  leadId: string,
  agentId: string,
): Promise<AgentLead> {
  const { data, error } = await supabase
    .from("agent_leads")
    .select("*")
    .eq("id", leadId)
    .eq("agent_id", agentId)
    .single();

  if (error) throw error;
  return data as AgentLead;
}

/**
 * Creates a new lead and logs a 'lead_created' activity.
 */
export async function createLead(
  supabase: SupabaseClient,
  agentId: string,
  input: CreateLeadInput,
): Promise<AgentLead> {
  const { data, error } = await supabase
    .from("agent_leads")
    .insert({ ...input, agent_id: agentId, stage: input.stage ?? "new_enquiry" })
    .select()
    .single();

  if (error) throw error;
  const lead = data as AgentLead;

  await addLeadActivity(
    supabase,
    lead.id,
    agentId,
    "lead_created",
    `Lead created for ${input.contact_name}`,
  );

  return lead;
}

/**
 * Updates a lead's pipeline stage and records a 'stage_changed' activity with
 * previous and new stage values in the metadata.
 */
export async function updateLeadStage(
  supabase: SupabaseClient,
  leadId: string,
  agentId: string,
  newStage: LeadStage,
  note?: string,
): Promise<AgentLead> {
  // Fetch current lead to capture previous stage
  const current = await getLeadById(supabase, leadId, agentId);

  const { data, error } = await supabase
    .from("agent_leads")
    .update({ stage: newStage })
    .eq("id", leadId)
    .eq("agent_id", agentId)
    .select()
    .single();

  if (error) throw error;
  const updated = data as AgentLead;

  await addLeadActivity(
    supabase,
    leadId,
    agentId,
    "stage_changed",
    note ?? `Stage changed from ${current.stage} to ${newStage}`,
    { previous_stage: current.stage, new_stage: newStage },
  );

  return updated;
}

/**
 * Assigns a lead to a team member and logs a 'lead_assigned' activity.
 */
export async function assignLead(
  supabase: SupabaseClient,
  leadId: string,
  agentId: string,
  assigneeId: string,
): Promise<AgentLead> {
  const { data, error } = await supabase
    .from("agent_leads")
    .update({ assigned_to: assigneeId })
    .eq("id", leadId)
    .eq("agent_id", agentId)
    .select()
    .single();

  if (error) throw error;
  const updated = data as AgentLead;

  await addLeadActivity(
    supabase,
    leadId,
    agentId,
    "lead_assigned",
    `Lead assigned to ${assigneeId}`,
    { assignee_id: assigneeId },
  );

  return updated;
}

/**
 * Returns all activity log entries for a given lead, oldest first.
 */
export async function getLeadActivities(
  supabase: SupabaseClient,
  leadId: string,
): Promise<AgentLeadActivity[]> {
  const { data, error } = await supabase
    .from("agent_lead_activities")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as AgentLeadActivity[];
}

/**
 * Inserts a new activity record for the given lead.
 */
export async function addLeadActivity(
  supabase: SupabaseClient,
  leadId: string,
  actorId: string,
  type: string,
  description: string,
  metadata?: Record<string, unknown>,
): Promise<AgentLeadActivity> {
  const { data, error } = await supabase
    .from("agent_lead_activities")
    .insert({
      lead_id: leadId,
      actor_id: actorId,
      activity_type: type,
      description,
      metadata: metadata ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as AgentLeadActivity;
}
