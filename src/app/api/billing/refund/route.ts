/**
 * POST /api/billing/refund
 *
 * Submits a refund request on behalf of the authenticated user.
 * Creates a pending record in refund_requests for admin review.
 *
 * Security:
 * - Requires authentication.
 * - Validates 14-day refund window.
 * - Prevents duplicate pending requests (idempotency).
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSubscription } from "@/services/billing/billing-service";

const REFUND_WINDOW_DAYS = 14;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { reason?: string; stripe_payment_intent_id?: string; amount?: number };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.reason?.trim()) {
    return NextResponse.json({ error: "reason is required" }, { status: 400 });
  }

  // ─── Idempotency: check for existing pending request ────────────────────────
  const { data: existingRequest } = await supabase
    .from("refund_requests")
    .select("id, status")
    .eq("user_id", user.id)
    .in("status", ["pending", "under_review"])
    .maybeSingle();

  if (existingRequest) {
    return NextResponse.json(
      { error: "A refund request is already in progress. Our team will review it shortly." },
      { status: 409 },
    );
  }

  // ─── 14-day window check ─────────────────────────────────────────────────────
  const subscription = await getSubscription(supabase, user.id);
  if (subscription) {
    // Check subscription was created within the last 14 days
    // We use updated_at on the subscription row as a proxy for activation date
    const { data: subRow } = await supabase
      .from("subscriptions")
      .select("created_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (subRow) {
      const createdAt = new Date((subRow as { created_at: string }).created_at);
      const daysSinceCreation =
        (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceCreation > REFUND_WINDOW_DAYS) {
        return NextResponse.json(
          {
            error: `Refund requests must be submitted within ${REFUND_WINDOW_DAYS} days of subscription start. Your subscription started ${Math.floor(daysSinceCreation)} days ago.`,
          },
          { status: 422 },
        );
      }
    }
  }

  // ─── Create refund request ───────────────────────────────────────────────────
  const { data, error } = await supabase
    .from("refund_requests")
    .insert({
      user_id: user.id,
      stripe_payment_intent_id: body.stripe_payment_intent_id ?? null,
      amount: body.amount ?? null,
      reason: body.reason.trim(),
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[billing/refund] Failed to create refund request:", error);
    return NextResponse.json({ error: "Failed to submit refund request" }, { status: 500 });
  }

  return NextResponse.json({ id: (data as { id: string }).id, status: "pending" }, { status: 201 });
}

/**
 * GET /api/billing/refund
 * Returns the user's refund request history.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("refund_requests")
    .select("id, reason, status, amount, created_at, updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch refund requests" }, { status: 500 });
  }

  return NextResponse.json({ requests: data ?? [] });
}
