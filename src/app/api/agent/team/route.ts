/**
 * /api/agent/team
 *
 * GET    -- list team members (?branch_id=) or branches (?type=branches).
 * POST   -- invite team member or create branch (?type=branch).
 * PATCH  -- update member role or assign to branch.
 * DELETE -- remove team member (set inactive).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createTeamMemberSchema, createBranchSchema } from "@/types/agent";
import type { TeamRole } from "@/types/agent";
import {
  getTeamMembers,
  inviteTeamMember,
  updateTeamMemberRole,
  removeTeamMember,
  getBranches,
  createBranch,
  updateBranch,
  assignMemberToBranch,
} from "@/services/agent/agent-team-service";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = request.nextUrl.searchParams;
    const type = params.get("type");

    if (type === "branches") {
      const branches = await getBranches(supabase, user.id);
      return NextResponse.json({ branches });
    }

    const branchId = params.get("branch_id") ?? undefined;
    const members = await getTeamMembers(supabase, user.id, branchId);
    return NextResponse.json({ members });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch team data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = request.nextUrl.searchParams;
    const type = params.get("type");
    const body = await request.json();

    if (type === "branch") {
      const parsed = createBranchSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0].message },
          { status: 400 },
        );
      }
      const branch = await createBranch(supabase, user.id, parsed.data);
      return NextResponse.json({ branch }, { status: 201 });
    }

    // Default: invite team member
    const parsed = createTeamMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const member = await inviteTeamMember(supabase, user.id, parsed.data);
    return NextResponse.json({ member }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create team resource";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      id?: string;
      role?: TeamRole;
      branch_id?: string;
      // Branch update fields
      type?: string;
      name?: string;
      [key: string]: unknown;
    };

    if (!body.id) {
      return NextResponse.json(
        { error: "Resource id is required" },
        { status: 400 },
      );
    }

    // Update branch
    if (body.type === "branch") {
      const { id, type: _type, ...input } = body;
      const branch = await updateBranch(supabase, id, user.id, input);
      return NextResponse.json({ branch });
    }

    // Assign member to branch
    if (body.branch_id) {
      const member = await assignMemberToBranch(
        supabase,
        body.id,
        user.id,
        body.branch_id,
      );
      return NextResponse.json({ member });
    }

    // Update member role
    if (body.role) {
      const member = await updateTeamMemberRole(
        supabase,
        body.id,
        user.id,
        body.role,
      );
      return NextResponse.json({ member });
    }

    return NextResponse.json(
      { error: "Provide role, branch_id, or type=branch with update data" },
      { status: 400 },
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update team resource";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { id?: string };

    if (!body.id) {
      return NextResponse.json(
        { error: "Member id is required" },
        { status: 400 },
      );
    }

    const member = await removeTeamMember(supabase, body.id, user.id);
    return NextResponse.json({ member });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to remove team member";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
