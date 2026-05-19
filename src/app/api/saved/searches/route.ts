/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
/**
 * API routes for saved searches.
 * GET: list saved searches for authenticated user
 * POST: save a search with filters and alert prefs
 * DELETE: remove a saved search
 * PATCH: update alert preferences
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  saveSearch,
  deleteSearch,
  getSavedSearches,
  updateAlertPreferences,
} from "@/services/saved/saved-searches-service";

/**
 * GET /api/saved/searches - Get user's saved searches
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searches = await getSavedSearches(supabase, user.id);
    return NextResponse.json(searches);
  } catch (error) {
    console.error("[saved-searches] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/saved/searches - Save a search
 * Body: { name: string, filters: SearchFilters, alerts_enabled?: boolean, alert_frequency?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, filters, alerts_enabled, alert_frequency } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 },
      );
    }

    if (!filters || typeof filters !== "object") {
      return NextResponse.json(
        { error: "filters is required" },
        { status: 400 },
      );
    }

    const result = await saveSearch(supabase, user.id, name, filters, {
      enabled: alerts_enabled ?? false,
      frequency: alert_frequency ?? "daily",
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[saved-searches] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/saved/searches - Remove a saved search
 * Body: { search_id: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { search_id } = body;

    if (!search_id || typeof search_id !== "string") {
      return NextResponse.json(
        { error: "search_id is required" },
        { status: 400 },
      );
    }

    await deleteSearch(supabase, user.id, search_id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[saved-searches] DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/saved/searches - Update alert preferences
 * Body: { search_id: string, alerts_enabled?: boolean, alert_frequency?: string }
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { search_id, alerts_enabled, alert_frequency } = body;

    if (!search_id || typeof search_id !== "string") {
      return NextResponse.json(
        { error: "search_id is required" },
        { status: 400 },
      );
    }

    const result = await updateAlertPreferences(supabase, user.id, search_id, {
      alerts_enabled: alerts_enabled ?? false,
      alert_frequency: alert_frequency ?? "daily",
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[saved-searches] PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
