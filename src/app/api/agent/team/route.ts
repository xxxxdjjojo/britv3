/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getTeamMembers,
  inviteTeamMember,
  updateTeamMemberRole,
  removeTeamMember,
  createBranch,
  assignMemberToBranch,
} from "@/services/agent/agent-team-service";
import type { TeamRole } from "@/types/agent";

/**
 * GET /api/agent/team
 * Returns team members, optionally filtered by ?branch_id.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const branchId = searchParams.get("branch_id") ?? undefined;

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
 * ?action=invite_member — invite a team member
 * ?action=create_branch — create a new branch
 * Defaults to invite_member if no action is specified.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const action = searchParams.get("action") ?? "invite_member";
    const body = await request.json();

    if (action === "create_branch") {
      const branch = await createBranch(supabase, user.id, body);
      return NextResponse.json(branch, { status: 201 });
    }

    // Default: invite_member
    const member = await inviteTeamMember(supabase, user.id, body);
    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("Failed to handle team POST:", error);
    return NextResponse.json(
      { error: "Failed to process team request" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/agent/team
 * ?action=update_role — update a member's role (body: { member_id, role })
 * ?action=assign_branch — assign member to branch (body: { member_id, branch_id })
 * Defaults to update_role.
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const action = searchParams.get("action") ?? "update_role";
    const body = await request.json();

    if (action === "assign_branch") {
      const { member_id, branch_id } = body;
      if (!member_id || !branch_id) {
        return NextResponse.json(
          { error: "member_id and branch_id are required" },
          { status: 400 },
        );
      }
      const member = await assignMemberToBranch(
        supabase,
        member_id,
        user.id,
        branch_id,
      );
      return NextResponse.json(member);
    }

    // Default: update_role
    const { member_id, role } = body;
    if (!member_id || !role) {
      return NextResponse.json(
        { error: "member_id and role are required" },
        { status: 400 },
      );
    }
    const member = await updateTeamMemberRole(
      supabase,
      member_id,
      user.id,
      role as TeamRole,
    );
    return NextResponse.json(member);
  } catch (error) {
    console.error("Failed to handle team PATCH:", error);
    return NextResponse.json(
      { error: "Failed to update team member" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/agent/team?member_id=xxx
 * Remove a team member (sets status to inactive).
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const memberId = searchParams.get("member_id");

    if (!memberId) {
      return NextResponse.json(
        { error: "member_id query parameter is required" },
        { status: 400 },
      );
    }

    await removeTeamMember(supabase, memberId, user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove team member:", error);
    return NextResponse.json(
      { error: "Failed to remove team member" },
      { status: 500 },
    );
  }
}
