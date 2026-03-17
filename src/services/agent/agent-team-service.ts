/**
 * Agent team service.
 * Manages team members and branches for estate agents.
 * All functions accept a Supabase client as first parameter for testability.
 */

import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AgentTeamMember,
  AgentBranch,
  TeamRole,
  CreateTeamMemberInput,
  CreateBranchInput,
} from "@/types/agent";

/**
 * Get team members for an agent, optionally filtered by branch.
 */
export async function getTeamMembers(
  supabase: SupabaseClient,
  agentId: string,
  branchId?: string,
): Promise<AgentTeamMember[]> {
  let query = supabase
    .from("agent_team_members")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  if (branchId) {
    query = query.eq("branch_id", branchId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get team members: ${error.message}`);
  }

  return (data ?? []) as AgentTeamMember[];
}

/**
 * Invite a new team member.
 * Inserts with status='pending' and sends an invite email.
 * If the email send fails, the insert still succeeds.
 */
export async function inviteTeamMember(
  supabase: SupabaseClient,
  agentId: string,
  input: CreateTeamMemberInput,
): Promise<AgentTeamMember> {
  const { data, error } = await supabase
    .from("agent_team_members")
    .insert({
      agent_id: agentId,
      user_id: input.user_id,
      email: input.email,
      name: input.name,
      role: input.role,
      branch_id: input.branch_id ?? null,
      status: "pending",
      invited_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to invite team member: ${error.message}`);
  }

  // Send invite email — fire-and-forget, fail silently
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Britestate <noreply@britestate.co.uk>",
      to: input.email,
      subject: "You have been invited to join a team on Britestate",
      html: `<p>Hi ${input.name},</p><p>You have been invited to join an estate agent team on Britestate with the role of <strong>${input.role}</strong>.</p><p>Please log in to Britestate to accept your invitation.</p>`,
    });
  } catch {
    // Email send failure should not block the invite
  }

  return data as AgentTeamMember;
}

/**
 * Update a team member's role.
 */
export async function updateTeamMemberRole(
  supabase: SupabaseClient,
  memberId: string,
  agentId: string,
  newRole: TeamRole,
): Promise<AgentTeamMember> {
  const { data, error } = await supabase
    .from("agent_team_members")
    .update({ role: newRole })
    .eq("id", memberId)
    .eq("agent_id", agentId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update team member role: ${error.message}`);
  }

  return data as AgentTeamMember;
}

/**
 * Remove a team member by setting their status to 'inactive'.
 */
export async function removeTeamMember(
  supabase: SupabaseClient,
  memberId: string,
  agentId: string,
): Promise<void> {
  const { error } = await supabase
    .from("agent_team_members")
    .update({ status: "inactive" })
    .eq("id", memberId)
    .eq("agent_id", agentId);

  if (error) {
    throw new Error(`Failed to remove team member: ${error.message}`);
  }
}

/**
 * Get all branches for an agent.
 */
export async function getBranches(
  supabase: SupabaseClient,
  agentId: string,
): Promise<AgentBranch[]> {
  const { data, error } = await supabase
    .from("agent_branches")
    .select("*")
    .eq("agent_id", agentId)
    .order("is_head_office", { ascending: false });

  if (error) {
    throw new Error(`Failed to get branches: ${error.message}`);
  }

  return (data ?? []) as AgentBranch[];
}

/**
 * Create a new branch for an agent.
 */
export async function createBranch(
  supabase: SupabaseClient,
  agentId: string,
  input: CreateBranchInput,
): Promise<AgentBranch> {
  const { data, error } = await supabase
    .from("agent_branches")
    .insert({
      agent_id: agentId,
      name: input.name,
      address_line_1: input.address_line_1 ?? null,
      address_line_2: input.address_line_2 ?? null,
      city: input.city ?? null,
      postcode: input.postcode ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      is_head_office: input.is_head_office ?? false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create branch: ${error.message}`);
  }

  return data as AgentBranch;
}

/**
 * Update an existing branch.
 */
export async function updateBranch(
  supabase: SupabaseClient,
  branchId: string,
  agentId: string,
  input: Partial<CreateBranchInput>,
): Promise<AgentBranch> {
  const { data, error } = await supabase
    .from("agent_branches")
    .update(input)
    .eq("id", branchId)
    .eq("agent_id", agentId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update branch: ${error.message}`);
  }

  return data as AgentBranch;
}

/**
 * Assign a team member to a branch.
 */
export async function assignMemberToBranch(
  supabase: SupabaseClient,
  memberId: string,
  agentId: string,
  branchId: string,
): Promise<AgentTeamMember> {
  const { data, error } = await supabase
    .from("agent_team_members")
    .update({ branch_id: branchId })
    .eq("id", memberId)
    .eq("agent_id", agentId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to assign member to branch: ${error.message}`);
  }

  return data as AgentTeamMember;
}
