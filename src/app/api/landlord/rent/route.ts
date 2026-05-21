/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRentCollection } from "@/services/landlord/financial-service";

/**
 * GET /api/landlord/rent
 * Returns rent collection grouped by paid/partial/overdue.
 * Defense-in-depth: verifies auth with getUser() before querying.
 */
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rentGroups = await getRentCollection(supabase);
    return NextResponse.json(rentGroups);
  } catch (error) {
    console.error("Failed to fetch rent collection:", error);
    return NextResponse.json(
      { error: "Failed to fetch rent collection" },
      { status: 500 },
    );
  }
}
