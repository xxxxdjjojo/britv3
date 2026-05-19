/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
/**
 * PATCH /api/moving-checklist/[id]  — toggle item completion
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toggleChecklistItem } from "@/services/moving/moving-checklist-service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 },
      );
    }

    const body = await request.json().catch(() => ({}));

    if (typeof body?.is_completed !== "boolean") {
      return NextResponse.json(
        { error: "is_completed (boolean) is required" },
        { status: 400 },
      );
    }

    const updated = await toggleChecklistItem(
      supabase,
      user.id,
      id,
      body.is_completed as boolean,
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[moving-checklist/[id]] PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
