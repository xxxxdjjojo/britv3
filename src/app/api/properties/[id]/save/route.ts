/**
 * API route for saving / unsaving a property from the detail page.
 *
 * POST   /api/properties/[id]/save  — save property, optional note (max 500 chars)
 * DELETE /api/properties/[id]/save  — unsave property
 *
 * Both require authentication; returns 401 when the session is missing.
 * The [id] segment is the listing_id (matches the pattern used by the
 * saved-properties service which operates on listing rows).
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  saveProperty,
  unsaveProperty,
} from "@/services/saved/saved-properties-service";

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const SaveBodySchema = z.object({
  notes: z
    .string()
    .max(500, "Notes must be 500 characters or fewer")
    .optional(),
});

// ---------------------------------------------------------------------------
// Route params type (Next.js App Router)
// ---------------------------------------------------------------------------

type RouteContext = {
  params: Promise<{ id: string }>;
};

// ---------------------------------------------------------------------------
// POST — save property
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: listingId } = await context.params;

    if (!listingId) {
      return NextResponse.json(
        { error: "Property ID is required" },
        { status: 400 },
      );
    }

    // Parse + validate body (allow empty body for "save without note")
    let notes: string | undefined;
    try {
      const rawBody = await request.json().catch(() => ({}));
      const parsed = SaveBodySchema.safeParse(rawBody);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message ?? "Invalid request body" },
          { status: 422 },
        );
      }
      notes = parsed.data.notes;
    } catch {
      // Malformed JSON — treat as save without note
      notes = undefined;
    }

    const result = await saveProperty(supabase, user.id, listingId, notes);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[properties/[id]/save] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE — unsave property
// ---------------------------------------------------------------------------

export async function DELETE(
  _request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: listingId } = await context.params;

    if (!listingId) {
      return NextResponse.json(
        { error: "Property ID is required" },
        { status: 400 },
      );
    }

    await unsaveProperty(supabase, user.id, listingId);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[properties/[id]/save] DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
