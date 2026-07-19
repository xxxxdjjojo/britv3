/**
 * PATCH /api/provider/jobs/[id]/status
 *
 * Updates the booking status for a provider job.
 * Validates allowed transitions and provider ownership.
 *
 * When transitioning to "completing", delegates to the job completion
 * orchestrator (initiateJobCompletion) which handles the intermediate state,
 * optional invoice generation, and rollback on failure.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireProviderAccess } from "@/lib/api/provider-access";
import { resolveProviderId } from "@/lib/provider/resolve-provider";
import { initiateJobCompletion } from "@/services/provider/provider-job-completion-service";

type Params = { params: Promise<{ id: string }> };

// Allowed status transitions from each state.
// "completing" is handled by the orchestrator, not a direct DB update.
const TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["in_progress", "cancelled"],
  in_progress: ["completing"],  // was ["completed"] — now routes through orchestrator
  completing: [],               // terminal for direct API; system handles progression
  // terminal states — no transitions
  completed: [],
  cancelled: [],
  // "active" is a display alias for confirmed/in_progress
  active: ["in_progress", "cancelled"],
};

export async function PATCH(request: Request, { params }: Params) {
  const providerAccess = await requireProviderAccess();
  if (providerAccess.response) return providerAccess.response;
  const { id: jobId } = await params;

  // Auth
  const supabase = await createClient();

  let providerId: string;
  try {
    const identity = await resolveProviderId(supabase);
    providerId = identity.providerId;
  } catch {
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

  // Route "completing" through the orchestrator
  if (nextStatus === "completing") {
    const result = await initiateJobCompletion(jobId, providerId, supabase);

    if (result.status === "rolled_back") {
      return NextResponse.json(
        { error: result.error ?? "Job completion failed" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      id: jobId,
      status: "completed",
      invoiceId: result.invoiceId,
    });
  }

  // Direct DB update for all other transitions
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
