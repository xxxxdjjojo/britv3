/**
 * Agent team service — team member management, branches, and invitations.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AgentTeamMember,
  AgentBranch,
  CreateTeamMemberInput,
  CreateBranchInput,
  TeamRole,
} from "@/types/agent";
import {
  createTeamMemberSchema,
  createBranchSchema,
  TEAM_ROLES,
} from "@/types/agent";

// -- Team member functions ----------------------------------------------------

/**
 * List team members for an agent, optionally filtered by branch.
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
    throw new Error(`Failed to fetch team members: ${error.message}`);
  }

  return (data ?? []) as AgentTeamMember[];
}

/**
 * Invite a new team member (status = 'pending').
 * NOTE: Email sending via Resend is stubbed — only inserts the record.
 */
export async function inviteTeamMember(
  supabase: SupabaseClient,
  agentId: string,
  input: CreateTeamMemberInput,
): Promise<AgentTeamMember> {
  const parsed = createTeamMemberSchema.parse(input);

  const insertData = {
    agent_id: agentId,
    user_id: agentId, // placeholder until invite is accepted
    email: parsed.email,
    name: parsed.name,
    role: parsed.role,
    branch_id: parsed.branch_id || null,
    status: "pending" as const,
    invited_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("agent_team_members")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to invite team member: ${error.message}`);
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
  if (!TEAM_ROLES.includes(newRole)) {
    throw new Error(`Invalid role: ${newRole}`);
  }

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

/**
 * Remove a team member by setting status to 'inactive'.
 */
export async function removeTeamMember(
  supabase: SupabaseClient,
  memberId: string,
  agentId: string,
): Promise<AgentTeamMember> {
  const { data, error } = await supabase
    .from("agent_team_members")
    .update({ status: "inactive" })
    .eq("id", memberId)
    .eq("agent_id", agentId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to remove team member: ${error.message}`);
  }

  return data as AgentTeamMember;
}

// -- Branch functions ---------------------------------------------------------

/**
 * List all branches for an agent, with a separate count of members per branch.
 */
export async function getBranches(
  supabase: SupabaseClient,
  agentId: string,
): Promise<(AgentBranch & { member_count: number })[]> {
  const { data: branches, error: branchErr } = await supabase
    .from("agent_branches")
    .select("*")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  if (branchErr) {
    throw new Error(`Failed to fetch branches: ${branchErr.message}`);
  }

  const branchList = (branches ?? []) as AgentBranch[];

  // Fetch member counts per branch in a single query
  const { data: members, error: memberErr } = await supabase
    .from("agent_team_members")
    .select("branch_id")
    .eq("agent_id", agentId)
    .neq("status", "inactive");

  if (memberErr) {
    throw new Error(`Failed to fetch member counts: ${memberErr.message}`);
  }

  const countMap = new Map<string, number>();
  for (const m of members ?? []) {
    const bid = (m as Record<string, unknown>).branch_id as string | null;
    if (bid) {
      countMap.set(bid, (countMap.get(bid) ?? 0) + 1);
    }
  }

  return branchList.map((b) => ({
    ...b,
    member_count: countMap.get(b.id) ?? 0,
  }));
}

/**
 * Create a new branch.
 */
export async function createBranch(
  supabase: SupabaseClient,
  agentId: string,
  input: CreateBranchInput,
): Promise<AgentBranch> {
  const parsed = createBranchSchema.parse(input);

  const insertData = {
    agent_id: agentId,
    name: parsed.name,
    address_line_1: parsed.address_line_1 || null,
    address_line_2: parsed.address_line_2 || null,
    city: parsed.city || null,
    postcode: parsed.postcode || null,
    phone: parsed.phone || null,
    email: parsed.email || null,
    is_head_office: parsed.is_head_office,
  };

  const { data, error } = await supabase
    .from("agent_branches")
    .insert(insertData)
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
  const updateData: Record<string, unknown> = {
    ...input,
    updated_at: new Date().toISOString(),
  };

  // Normalize empty strings to null
  for (const key of [
    "address_line_1",
    "address_line_2",
    "city",
    "postcode",
    "phone",
    "email",
  ]) {
    if (updateData[key] === "") updateData[key] = null;
  }

  const { data, error } = await supabase
    .from("agent_branches")
    .update(updateData)
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
 * Delete a branch. Only succeeds if no active team members are assigned.
 */
export async function deleteBranch(
  supabase: SupabaseClient,
  branchId: string,
  agentId: string,
): Promise<void> {
  // Check no active members are assigned
  const { count, error: countErr } = await supabase
    .from("agent_team_members")
    .select("id", { count: "exact", head: true })
    .eq("branch_id", branchId)
    .eq("agent_id", agentId)
    .neq("status", "inactive");

  if (countErr) {
    throw new Error(`Failed to check branch members: ${countErr.message}`);
  }

  if ((count ?? 0) > 0) {
    throw new Error(
      "Cannot delete branch with active team members. Reassign members first.",
    );
  }

  const { error } = await supabase
    .from("agent_branches")
    .delete()
    .eq("id", branchId)
    .eq("agent_id", agentId);

  if (error) {
    throw new Error(`Failed to delete branch: ${error.message}`);
  }
}
