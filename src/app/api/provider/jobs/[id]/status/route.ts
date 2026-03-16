/**
 * PATCH /api/provider/jobs/[id]/status
 *
 * Updates the booking status for a provider job.
 * Validates allowed transitions and provider ownership.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

// Allowed status transitions
const TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["in_progress", "cancelled"],
  in_progress: ["completed"],
  // terminal states — no transitions
  completed: [],
  cancelled: [],
  // "active" is a display alias for confirmed/in_progress
  active: ["in_progress", "cancelled"],
};

export async function PATCH(request: Request, { params }: Params) {
  const { id: jobId } = await params;

  // Auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const nextStatus = (body as Record<string, unknown>)["status"];
  if (typeof nextStatus !== "string") {
    return NextResponse.json({ error: "status field required" }, { status: 400 });
  }

  // Resolve provider id
  const { data: providerProfile } = await supabase
    .from("service_provider_details")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const providerId = providerProfile?.id ?? user.id;

  // Fetch current booking
  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("id, provider_id, status")
    .eq("id", jobId)
    .maybeSingle();

  if (fetchError || !booking) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const row = booking as Record<string, unknown>;

  // Ownership check
  if ((row["provider_id"] as string) !== providerId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const currentStatus = row["status"] as string;
  const allowed = TRANSITIONS[currentStatus] ?? [];

  if (!allowed.includes(nextStatus)) {
    return NextResponse.json(
      { error: `Cannot transition from '${currentStatus}' to '${nextStatus}'` },
      { status: 422 },
    );
  }

  // Update
  const { error: updateError } = await supabase
    .from("bookings")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", jobId);

  if (updateError) {
    return NextResponse.json(
      { error: `Failed to update status: ${updateError.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ id: jobId, status: nextStatus });
}
