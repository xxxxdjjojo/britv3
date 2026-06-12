/**
 * Admin Truedeed invoice-candidate review.
 *
 * GET  /api/admin/truedeed/invoice-candidates — pending / on-hold candidates.
 * POST /api/admin/truedeed/invoice-candidates — record an approve/reject
 *      decision ({ candidateId, decision, note }); rejections require a note.
 */

import { NextRequest, NextResponse } from "next/server";
import { adminOnly } from "@/lib/admin-guard";
import {
  decideCandidate,
  listPendingCandidates,
} from "@/services/truedeed/candidate-review-service";

export async function GET(request: NextRequest): Promise<Response> {
  const ctx = await adminOnly(request);
  if (ctx instanceof Response) return ctx;

  try {
    const candidates = await listPendingCandidates();
    if (candidates === null) {
      return NextResponse.json(
        { error: "Failed to load invoice candidates" },
        { status: 500 },
      );
    }
    return NextResponse.json({ candidates });
  } catch (err) {
    console.warn("[GET /api/admin/truedeed/invoice-candidates] failed", {
      error_type: err instanceof Error ? err.name : "unknown",
    });
    return NextResponse.json(
      { error: "Failed to load invoice candidates" },
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

  const { candidateId, decision, note } = body as {
    candidateId?: unknown;
    decision?: unknown;
    note?: unknown;
  };

  if (typeof candidateId !== "string" || candidateId.length === 0) {
    return NextResponse.json(
      { error: "candidateId is required" },
      { status: 400 },
    );
  }
  if (decision !== "approved" && decision !== "rejected") {
    return NextResponse.json(
      { error: "decision must be 'approved' or 'rejected'" },
      { status: 400 },
    );
  }
  const noteText = typeof note === "string" ? note : "";
  if (decision === "rejected" && noteText.trim().length === 0) {
    return NextResponse.json(
      { error: "A note is required to reject a candidate" },
      { status: 400 },
    );
  }

  try {
    const ok = await decideCandidate({
      candidateId,
      reviewerId: ctx.user.id,
      decision,
      note: noteText,
    });

    if (!ok) {
      return NextResponse.json(
        { error: "Failed to record the decision" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.warn("[POST /api/admin/truedeed/invoice-candidates] failed", {
      error_type: err instanceof Error ? err.name : "unknown",
    });
    return NextResponse.json(
      { error: "Failed to record the decision" },
      { status: 500 },
    );
  }
}
