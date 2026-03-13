/**
 * Agent lead service -- CRUD for leads, stage transitions, assignment,
 * and activity logging.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AgentLead,
  AgentLeadActivity,
  CreateLeadInput,
  LeadStage,
} from "@/types/agent";
import { createLeadSchema } from "@/types/agent";

// -- Service functions --------------------------------------------------------

/**
 * List leads for an agent, optionally filtered by pipeline stage.
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

  if (error) {
    throw new Error(`Failed to fetch leads: ${error.message}`);
  }

  return (data ?? []) as AgentLead[];
}

/**
 * Fetch a single lead with its activities.
 * Enforces ownership via agent_id match.
 */
export async function getLeadById(
  supabase: SupabaseClient,
  leadId: string,
  agentId: string,
): Promise<{ lead: AgentLead; activities: AgentLeadActivity[] }> {
  const { data: lead, error: leadErr } = await supabase
    .from("agent_leads")
    .select("*")
    .eq("id", leadId)
    .eq("agent_id", agentId)
    .single();

  if (leadErr || !lead) {
    throw new Error(leadErr?.message ?? "Lead not found");
  }

  const { data: activities, error: actErr } = await supabase
    .from("agent_lead_activities")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  if (actErr) {
    throw new Error(`Failed to fetch lead activities: ${actErr.message}`);
  }

  return {
    lead: lead as AgentLead,
    activities: (activities ?? []) as AgentLeadActivity[],
  };
}

/**
 * Create a new lead and log a 'lead_created' activity.
 */
export async function createLead(
  supabase: SupabaseClient,
  agentId: string,
  input: CreateLeadInput,
): Promise<AgentLead> {
  const parsed = createLeadSchema.parse(input);

  const insertData = {
    agent_id: agentId,
    contact_name: parsed.contact_name,
    contact_email: parsed.contact_email || null,
    contact_phone: parsed.contact_phone || null,
    property_id: parsed.property_id || null,
    stage: parsed.stage,
    source: parsed.source ?? null,
    assigned_to: parsed.assigned_to || null,
    notes: parsed.notes || null,
  };

  const { data, error } = await supabase
    .from("agent_leads")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create lead: ${error.message}`);
  }

  const lead = data as AgentLead;

  // Log creation activity
  await addLeadActivity(
    supabase,
    lead.id,
    agentId,
    "lead_created",
    `Lead created for ${lead.contact_name}`,
  );

  return lead;
}

/**
 * Move a lead to a new pipeline stage and record the transition.
 */
export async function updateLeadStage(
  supabase: SupabaseClient,
  leadId: string,
  agentId: string,
  newStage: LeadStage,
  note?: string,
): Promise<AgentLead> {
  // Fetch current lead to capture previous stage
  const { data: current, error: fetchErr } = await supabase
    .from("agent_leads")
    .select("stage")
    .eq("id", leadId)
    .eq("agent_id", agentId)
    .single();

  if (fetchErr || !current) {
    throw new Error(fetchErr?.message ?? "Lead not found");
  }

  const previousStage = (current as Record<string, unknown>).stage as string;

  const { data, error } = await supabase
    .from("agent_leads")
    .update({ stage: newStage, updated_at: new Date().toISOString() })
    .eq("id", leadId)
    .eq("agent_id", agentId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update lead stage: ${error.message}`);
  }

  const lead = data as AgentLead;

  // Log stage change activity
  await addLeadActivity(
    supabase,
    leadId,
    agentId,
    "stage_changed",
    note ?? `Stage changed from ${previousStage} to ${newStage}`,
    { previous_stage: previousStage, new_stage: newStage },
  );

  return lead;
}

/**
 * Assign (or re-assign) a lead to a team member.
 */
export async function assignLead(
  supabase: SupabaseClient,
  leadId: string,
  agentId: string,
  assigneeId: string,
): Promise<AgentLead> {
  const { data, error } = await supabase
    .from("agent_leads")
    .update({ assigned_to: assigneeId, updated_at: new Date().toISOString() })
    .eq("id", leadId)
    .eq("agent_id", agentId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to assign lead: ${error.message}`);
  }

  const lead = data as AgentLead;

  await addLeadActivity(
    supabase,
    leadId,
    agentId,
    "lead_assigned",
    `Lead assigned to ${assigneeId}`,
    { assignee_id: assigneeId },
  );

  return lead;
}

/**
 * Get all activities for a given lead, ordered newest-first.
 */
export async function getLeadActivities(
  supabase: SupabaseClient,
  leadId: string,
): Promise<AgentLeadActivity[]> {
  const { data, error } = await supabase
    .from("agent_lead_activities")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch lead activities: ${error.message}`);
  }

  return (data ?? []) as AgentLeadActivity[];
}

/**
 * Append an activity entry to a lead's timeline.
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
      metadata: metadata ?? {},
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add lead activity: ${error.message}`);
  }

  return data as AgentLeadActivity;
}
