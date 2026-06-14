/**
 * POST /api/truedeed/rebuttals — submit a rebuttal (dispute) against an
 * introduction. Multipart form data: introductionId, evidenceDatedAt
 * (yyyy-mm-dd), files (one or more evidence files).
 *
 * Authorisation (agent or branch team member) is enforced by submitRebuttal.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  submitRebuttal,
  type SubmitRebuttalError,
} from "@/services/truedeed/rebuttal-service";

const ERROR_RESPONSES: Record<
  SubmitRebuttalError,
  { status: number; message: string }
> = {
  not_found: { status: 404, message: "Introduction not found." },
  not_authorised: {
    status: 403,
    message: "You are not authorised to dispute this introduction.",
  },
  window_expired: {
    status: 410,
    message: "The rebuttal window for this introduction has closed.",
  },
  evidence_not_predating: {
    status: 422,
    message: "Your evidence date must be before the introduction was recorded.",
  },
  no_evidence: { status: 400, message: "An evidence file is required." },
  upload_failed: {
    status: 500,
    message: "Failed to store your evidence files. Please try again.",
  },
  insert_failed: {
    status: 500,
    message: "Failed to record your dispute. Please try again.",
  },
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return NextResponse.json(
        { error: "Invalid multipart form data" },
        { status: 400 },
      );
    }

    const introductionId = form.get("introductionId");
    if (typeof introductionId !== "string" || introductionId.length === 0) {
      return NextResponse.json(
        { error: "introductionId is required" },
        { status: 400 },
      );
    }

    const evidenceDatedAt = form.get("evidenceDatedAt");
    if (
      typeof evidenceDatedAt !== "string" ||
      Number.isNaN(Date.parse(evidenceDatedAt))
    ) {
      return NextResponse.json(
        { error: "evidenceDatedAt must be a valid date (yyyy-mm-dd)" },
        { status: 400 },
      );
    }

    const files = form
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File);

    const result = await submitRebuttal({
      introductionId,
      userId: user.id,
      evidenceDatedAt: new Date(evidenceDatedAt),
      files,
    });

    if (!result.ok) {
      const mapped = ERROR_RESPONSES[result.error];
      return NextResponse.json(
        { error: mapped.message, code: result.error },
        { status: mapped.status },
      );
    }

    return NextResponse.json({ rebuttalId: result.rebuttalId }, { status: 201 });
  } catch (err) {
    console.warn("[POST /api/truedeed/rebuttals] failed", {
      error_type: err instanceof Error ? err.name : "unknown",
    });
    return NextResponse.json(
      { error: "Failed to submit your dispute" },
      { status: 500 },
    );
  }
}
