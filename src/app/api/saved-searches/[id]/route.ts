/**
 * API route for updating a single saved search by ID.
 * PATCH /api/saved-searches/:id
 *
 * Updatable fields: name, alerts_enabled, alert_frequency.
 * Ownership verified via user_id = auth.uid().
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const VALID_FREQUENCIES = new Set(["instant", "daily", "weekly"]);

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
        { error: "Invalid search ID" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    // Validate and collect updatable fields
    if ("name" in body) {
      if (typeof body.name !== "string" || body.name.trim().length === 0) {
        return NextResponse.json(
          { error: "name must be a non-empty string" },
          { status: 400 },
        );
      }
      if (body.name.trim().length > 100) {
        return NextResponse.json(
          { error: "name must be 100 characters or fewer" },
          { status: 400 },
        );
      }
      updates.name = body.name.trim();
    }

    if ("alerts_enabled" in body) {
      if (typeof body.alerts_enabled !== "boolean") {
        return NextResponse.json(
          { error: "alerts_enabled must be a boolean" },
          { status: 400 },
        );
      }
      updates.alerts_enabled = body.alerts_enabled;
    }

    if ("alert_frequency" in body) {
      if (!VALID_FREQUENCIES.has(body.alert_frequency)) {
        return NextResponse.json(
          { error: "alert_frequency must be instant, daily, or weekly" },
          { status: 400 },
        );
      }
      updates.alert_frequency = body.alert_frequency;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("saved_searches")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Search not found or update failed" },
        { status: 404 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[saved-searches] PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
