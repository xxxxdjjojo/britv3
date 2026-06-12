/**
 * POST /api/truedeed/outcomes — report the outcome of an introduction
 * (Truedeed Phase 2). JSON body:
 *   { introductionId: uuid, outcome, completionDate?: yyyy-mm-dd,
 *     agreedPricePence?: integer }
 *
 * Authorisation (agent or branch team member) is enforced by reportOutcome.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { reportOutcome } from "@/services/truedeed/outcome-service";

const bodySchema = z.object({
  introductionId: z.string().uuid(),
  outcome: z.enum([
    "offer_accepted",
    "exchanged",
    "completed",
    "fell_through",
    "tenancy_commenced",
    "tenancy_abandoned",
  ]),
  completionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "completionDate must be yyyy-mm-dd")
    .optional(),
  agreedPricePence: z.number().int().positive().optional(),
});

const ERROR_RESPONSES: Record<string, { status: number; message: string }> = {
  not_authorised: {
    status: 403,
    message: "You are not authorised to report an outcome for this introduction.",
  },
  missing_completion_fields: {
    status: 422,
    message:
      "A completed outcome needs both a completion date and an agreed price.",
  },
  invalid_state: {
    status: 409,
    message: "This introduction cannot move to the reported outcome.",
  },
  internal: {
    status: 500,
    message: "Failed to report the outcome. Please try again.",
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

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request body" },
        { status: 400 },
      );
    }

    const { introductionId, outcome, completionDate, agreedPricePence } =
      parsed.data;

    const result = await reportOutcome({
      introductionId,
      reportedBy: user.id,
      outcome,
      ...(completionDate ? { completionDate: new Date(completionDate) } : {}),
      ...(agreedPricePence !== undefined ? { agreedPricePence } : {}),
    });

    if (!result.ok) {
      const mapped = ERROR_RESPONSES[result.error] ?? ERROR_RESPONSES.internal;
      return NextResponse.json(
        { error: mapped.message, code: result.error },
        { status: mapped.status },
      );
    }

    return NextResponse.json(
      {
        outcomeId: result.outcomeId,
        ...(result.invoiceCandidateId
          ? { invoiceCandidateId: result.invoiceCandidateId }
          : {}),
      },
      { status: 201 },
    );
  } catch (err) {
    console.warn("[POST /api/truedeed/outcomes] failed", {
      error_type: err instanceof Error ? err.name : "unknown",
    });
    return NextResponse.json(
      { error: "Failed to report the outcome" },
      { status: 500 },
    );
  }
}
