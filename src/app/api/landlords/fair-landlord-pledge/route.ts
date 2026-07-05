import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const PledgeBodySchema = z.object({
  displayName: z.string().min(1).max(120),
  area: z.string().min(1).max(120),
});

/**
 * Fair Landlord Register — signup and revocation (Influence Strategy 3.4).
 *
 * POST: authenticated landlord signs the charter (status='pending', awaiting
 *   admin publish). Returns 409 if they already have an active pledge.
 * DELETE: authenticated landlord revokes their active pledge.
 */

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Role guard: only landlords may sign.
  const role = (user.app_metadata as Record<string, unknown>)?.role;
  if (role !== "landlord") {
    return NextResponse.json(
      { error: "Forbidden — only landlord accounts may sign the charter" },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = PledgeBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { error: insertError } = await supabase
    .from("fair_landlord_pledges")
    .insert({
      landlord_id: user.id,
      display_name: parsed.data.displayName.trim(),
      area: parsed.data.area.trim(),
      status: "pending",
    });

  if (insertError) {
    // Unique index violation → already has an active pledge.
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "already_pledged" },
        { status: 409 },
      );
    }
    console.warn("[fair-landlord-pledge] insert failed", insertError.message);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (user.app_metadata as Record<string, unknown>)?.role;
  if (role !== "landlord") {
    return NextResponse.json(
      { error: "Forbidden — only landlord accounts may revoke a pledge" },
      { status: 403 },
    );
  }

  const { error: updateError } = await supabase
    .from("fair_landlord_pledges")
    .update({ status: "revoked" })
    .eq("landlord_id", user.id)
    .neq("status", "revoked");

  if (updateError) {
    console.warn("[fair-landlord-pledge] revoke failed", updateError.message);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
