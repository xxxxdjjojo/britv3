import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createBranchSchema } from "@/types/agent";
import {
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
} from "@/services/agent/agent-team-service";

/**
 * GET /api/agent/branches
 * Returns all branches for the authenticated agent.
 */
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const branches = await getBranches(supabase, user.id);
    return NextResponse.json(branches);
  } catch (error) {
    console.error("Failed to fetch branches:", error);
    return NextResponse.json(
      { error: "Failed to fetch branches" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/agent/branches
 * Creates a new branch.
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
    const parsed = createBranchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const branch = await createBranch(supabase, user.id, parsed.data);
    return NextResponse.json(branch, { status: 201 });
  } catch (error) {
    console.error("Failed to create branch:", error);
    return NextResponse.json(
      { error: "Failed to create branch" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/agent/branches
 * Updates an existing branch. Requires { id, ...fields } in the body.
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
    const { id, ...fields } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Branch id is required" },
        { status: 400 },
      );
    }

    const updated = await updateBranch(supabase, id, user.id, fields);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update branch:", error);
    return NextResponse.json(
      { error: "Failed to update branch" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/agent/branches
 * Deletes a branch (only if no active members). Requires ?id query param.
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
      { error: "Branch id is required" },
      { status: 400 },
    );
  }

  try {
    await deleteBranch(supabase, id, user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete branch:", error);
    return NextResponse.json(
      { error: "Failed to delete branch" },
      { status: 500 },
    );
  }
}
