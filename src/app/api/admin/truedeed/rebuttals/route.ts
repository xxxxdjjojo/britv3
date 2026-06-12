/**
 * Admin Truedeed rebuttal moderation.
 *
 * GET  /api/admin/truedeed/rebuttals — pending (undecided) rebuttals.
 * POST /api/admin/truedeed/rebuttals — record an uphold/reject decision
 *      ({ rebuttalId, decision, reason }); upholding transitions the
 *      introduction to 'rebutted'.
 */

import { NextRequest, NextResponse } from "next/server";
import { adminOnly } from "@/lib/admin-guard";
import { getPendingRebuttals } from "@/lib/truedeed/queries";
import { decideRebuttal } from "@/services/truedeed/rebuttal-service";

export async function GET(request: NextRequest): Promise<Response> {
  const ctx = await adminOnly(request);
  if (ctx instanceof Response) return ctx;

  try {
    const rebuttals = await getPendingRebuttals();
    return NextResponse.json({ rebuttals });
  } catch (err) {
    console.warn("[GET /api/admin/truedeed/rebuttals] failed", {
      error_type: err instanceof Error ? err.name : "unknown",
    });
    return NextResponse.json(
      { error: "Failed to load pending rebuttals" },
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

  const { rebuttalId, decision, reason } = body as {
    rebuttalId?: unknown;
    decision?: unknown;
    reason?: unknown;
  };

  if (typeof rebuttalId !== "string" || rebuttalId.length === 0) {
    return NextResponse.json(
      { error: "rebuttalId is required" },
      { status: 400 },
    );
  }
  if (decision !== "upheld" && decision !== "rejected") {
    return NextResponse.json(
      { error: "decision must be 'upheld' or 'rejected'" },
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
    const ok = await decideRebuttal({
      rebuttalId,
      adminId: ctx.user.id,
      decision,
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
    console.warn("[POST /api/admin/truedeed/rebuttals] failed", {
      error_type: err instanceof Error ? err.name : "unknown",
    });
    return NextResponse.json(
      { error: "Failed to record the decision" },
      { status: 500 },
    );
  }
}
