/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
/**
 * API routes for saved properties (shortlist).
 * GET: list saved properties for authenticated user
 * POST: save a property to shortlist
 * DELETE: remove a property from shortlist
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  saveProperty,
  unsaveProperty,
  getSavedProperties,
} from "@/services/saved/saved-properties-service";

/**
 * GET /api/saved/properties - Get user's saved properties
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const saved = await getSavedProperties(supabase, user.id);
    return NextResponse.json(saved);
  } catch (error) {
    console.error("[saved-properties] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/saved/properties - Save a property
 * Body: { listing_id: string, notes?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { listing_id, notes } = body;

    if (!listing_id || typeof listing_id !== "string") {
      return NextResponse.json(
        { error: "listing_id is required" },
        { status: 400 },
      );
    }

    const result = await saveProperty(supabase, user.id, listing_id, notes);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[saved-properties] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/saved/properties - Remove a saved property
 * Body: { listing_id: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { listing_id } = body;

    if (!listing_id || typeof listing_id !== "string") {
      return NextResponse.json(
        { error: "listing_id is required" },
        { status: 400 },
      );
    }

    await unsaveProperty(supabase, user.id, listing_id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[saved-properties] DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
