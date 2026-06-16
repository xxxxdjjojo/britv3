/**
 * POST /api/truedeed/disputes — agent-side dispute submission (Phase 5).
 *
 * Multipart form: invoiceId (string), grounds (string), evidence (file, 0..n).
 * Authenticates via Supabase session; the dispute-service enforces the rest
 * (auth match, clause-9.5 window, sanitised evidence upload, RLS-friendly
 * insert). Service errors map to 4xx; the only 5xx path is an internal
 * failure.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { raiseDispute } from "@/services/truedeed/dispute-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_EVIDENCE_FILES = 10;
const MAX_EVIDENCE_BYTES_EACH = 25 * 1024 * 1024; // 25 MB

const ERROR_STATUS: Record<string, number> = {
  grounds_required: 400,
  not_found: 404,
  not_authorised: 403,
  already_disputed: 409,
  upload_failed: 502,
  insert_failed: 500,
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form" }, { status: 400 });
  }

  const invoiceId = String(form.get("invoiceId") ?? "").trim();
  const grounds = String(form.get("grounds") ?? "");
  if (!invoiceId) {
    return NextResponse.json({ error: "invoice_id_required" }, { status: 400 });
  }

  const filesRaw = form.getAll("evidence");
  if (filesRaw.length > MAX_EVIDENCE_FILES) {
    return NextResponse.json(
      { error: "too_many_files" },
      { status: 413 },
    );
  }
  const files: File[] = [];
  for (const entry of filesRaw) {
    if (!(entry instanceof File)) continue;
    if (entry.size === 0) continue;
    if (entry.size > MAX_EVIDENCE_BYTES_EACH) {
      return NextResponse.json(
        { error: "file_too_large" },
        { status: 413 },
      );
    }
    files.push(entry);
  }

  const result = await raiseDispute({
    invoiceId,
    raisedBy: user.id,
    grounds,
    files,
  });

  if (!result.ok) {
    const status = ERROR_STATUS[result.error] ?? 500;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json(
    {
      ok: true,
      disputeId: result.disputeId,
      properlyRaised: result.properlyRaised,
    },
    { status: 201 },
  );
}
