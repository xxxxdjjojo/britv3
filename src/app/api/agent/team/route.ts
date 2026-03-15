import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createTeamMemberSchema } from "@/types/agent";
import type { TeamRole } from "@/types/agent";
import {
  getTeamMembers,
  inviteTeamMember,
  updateTeamMemberRole,
  assignMemberToBranch,
  removeTeamMember,
} from "@/services/agent/agent-team-service";

/**
 * GET /api/agent/team
 * Returns team members for the authenticated agent.
 * Accepts ?branch_id filter.
 */
export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branch_id") ?? undefined;

  try {
    const members = await getTeamMembers(supabase, user.id, branchId);
    return NextResponse.json(members);
  } catch (error) {
    console.error("Failed to fetch team members:", error);
    return NextResponse.json(
      { error: "Failed to fetch team members" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/agent/team
 * Invites a new team member (status = pending).
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as unknown;
    const parsed = createTeamMemberSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const member = await inviteTeamMember(supabase, user.id, parsed.data);
    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("Failed to invite team member:", error);
    return NextResponse.json(
      { error: "Failed to invite team member" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/agent/team
 * Updates a team member. Supports:
 *   { id, action: "update_role", role: TeamRole }
 *   { id, action: "assign_branch", branch_id: string }
 */
export async function PATCH(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const { id, action } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Member id is required" },
        { status: 400 },
      );
    }

    if (action === "update_role") {
      const role = body.role as TeamRole;
      if (!role) {
        return NextResponse.json(
          { error: "role is required for update_role action" },
          { status: 400 },
        );
      }
      const updated = await updateTeamMemberRole(supabase, id, user.id, role);
      return NextResponse.json(updated);
    }

    if (action === "assign_branch") {
      const branchId = body.branch_id as string;
      if (!branchId) {
        return NextResponse.json(
          { error: "branch_id is required for assign_branch action" },
          { status: 400 },
        );
      }
      const updated = await assignMemberToBranch(
        supabase,
        id,
        user.id,
        branchId,
      );
      return NextResponse.json(updated);
    }

    return NextResponse.json(
      { error: "Invalid action. Use update_role or assign_branch." },
      { status: 400 },
    );
  } catch (error) {
    console.error("Failed to update team member:", error);
    return NextResponse.json(
      { error: "Failed to update team member" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/agent/team
 * Removes a team member (sets status to inactive). Requires ?id query param.
 */
export async function DELETE(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Member id is required" },
      { status: 400 },
    );
  }

  try {
    await removeTeamMember(supabase, id, user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove team member:", error);
    return NextResponse.json(
      { error: "Failed to remove team member" },
      { status: 500 },
    );
  }
}
