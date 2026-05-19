/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateDeposit } from "@/services/landlord/deposit-service";

/**
 * PATCH /api/landlord/deposits/[id]
 * Updates an existing deposit registration (scheme reference, status, dates, etc.).
 * Defense-in-depth: verifies auth with getUser() before any DB operation.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Missing deposit id" }, { status: 400 });
  }

  try {
    const body = await request.json() as Record<string, unknown>;
    const deposit = await updateDeposit(supabase, id, body);
    return NextResponse.json(deposit);
  } catch (error) {
    console.error("Failed to update deposit:", error);
    return NextResponse.json(
      { error: "Failed to update deposit" },
      { status: 500 },
    );
  }
}
