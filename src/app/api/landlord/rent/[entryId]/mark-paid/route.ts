/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * PATCH /api/landlord/rent/[entryId]/mark-paid
 * Marks a financial entry as paid. Scoped to authenticated landlord.
 * Defense-in-depth: verifies auth with getUser() before any DB operation.
 */
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ entryId: string }> },
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { entryId } = await params;

  if (!entryId) {
    return NextResponse.json({ error: "Missing entryId" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("financial_entries")
    .update({
      payment_status: "paid",
      paid_at: new Date().toISOString(),
    })
    .eq("id", entryId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error || !data) {
    console.error("Failed to mark entry as paid:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to mark as paid" },
      { status: 500 },
    );
  }

  return NextResponse.json(data);
}
