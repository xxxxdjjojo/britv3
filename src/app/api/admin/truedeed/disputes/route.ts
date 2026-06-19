/**
 * Admin Truedeed dispute moderation (Phase 5).
 *
 * GET  /api/admin/truedeed/disputes — open (status='open') invoice disputes.
 * POST /api/admin/truedeed/disputes — record a concede/reject decision
 *      ({ disputeId, decision, category, reason }). decide_invoice_dispute
 *      drives transition_invoice ('dispute_resolved-upheld' on conceded
 *      → invoice cancelled; '-rejected' → invoice resumes at
 *      state_before_dispute, clock restarts where it stopped).
 */

import { NextRequest, NextResponse } from "next/server";
import { adminOnly } from "@/lib/admin-guard";
import { getOpenDisputes } from "@/lib/truedeed/queries";
import { resolveDispute } from "@/services/truedeed/dispute-service";

const VALID_CATEGORIES = new Set([
  "D1_source",
  "D2_fell_through",
  "D3_different_applicant",
  "D4_no_tail_agreement",
  "D5_fee_level",
]);

export async function GET(request: NextRequest): Promise<Response> {
  const ctx = await adminOnly(request);
  if (ctx instanceof Response) return ctx;

  try {
    const disputes = await getOpenDisputes();
    return NextResponse.json({ disputes });
  } catch (err) {
    console.warn("[GET /api/admin/truedeed/disputes] failed", {
      error_type: err instanceof Error ? err.name : "unknown",
    });
    return NextResponse.json(
      { error: "Failed to load open disputes" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  const ctx = await adminOnly(request);
  if (ctx instanceof Response) return ctx;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { disputeId, decision, category, reason } = body as {
    disputeId?: unknown;
    decision?: unknown;
    category?: unknown;
    reason?: unknown;
  };

  if (typeof disputeId !== "string" || disputeId.length === 0) {
    return NextResponse.json(
      { error: "disputeId is required" },
      { status: 400 },
    );
  }
  if (decision !== "conceded" && decision !== "rejected") {
    return NextResponse.json(
      { error: "decision must be 'conceded' or 'rejected'" },
      { status: 400 },
    );
  }
  if (typeof category !== "string" || !VALID_CATEGORIES.has(category)) {
    return NextResponse.json(
      { error: "category must be one of D1_source..D5_fee_level" },
      { status: 400 },
    );
  }
  if (typeof reason !== "string" || reason.trim().length === 0) {
    return NextResponse.json(
      { error: "A reason is required for every decision" },
      { status: 400 },
    );
  }

  try {
    const ok = await resolveDispute({
      disputeId,
      adminId: ctx.user.id,
      decision,
      category,
      reason,
    });
    if (!ok) {
      return NextResponse.json(
        { error: "Failed to record the decision" },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.warn("[POST /api/admin/truedeed/disputes] failed", {
      error_type: err instanceof Error ? err.name : "unknown",
    });
    return NextResponse.json(
      { error: "Failed to record the decision" },
      { status: 500 },
    );
  }
}
