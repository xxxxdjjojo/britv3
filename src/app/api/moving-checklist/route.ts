/**
 * API routes for the moving checklist.
 * GET  /api/moving-checklist?offer_id=xxx  — list items (offer_id optional)
 * POST /api/moving-checklist               — create default checklist
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getChecklistItems,
  createDefaultChecklist,
  addCustomItem,
} from "@/services/moving/moving-checklist-service";

/**
 * GET /api/moving-checklist
 * Query params: offer_id (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const offerId = searchParams.get("offer_id") ?? undefined;

    const items = await getChecklistItems(supabase, user.id, offerId);
    return NextResponse.json(items);
  } catch (error) {
    console.error("[moving-checklist] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/moving-checklist
 * Body: { offer_id?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    // Custom item creation — differentiated by presence of `title` field
    if (typeof body?.title === "string" && body.title.trim()) {
      const description =
        typeof body?.description === "string" ? body.description : undefined;
      const item = await addCustomItem(
        supabase,
        user.id,
        body.title.trim(),
        description,
      );
      return NextResponse.json(item, { status: 201 });
    }

    // Default checklist creation
    const offerId =
      typeof body?.offer_id === "string" ? body.offer_id : undefined;
    const role =
      typeof body?.role === "string" ? body.role : undefined;

    const items = await createDefaultChecklist(supabase, user.id, offerId, role);
    return NextResponse.json(items, { status: 201 });
  } catch (error) {
    console.error("[moving-checklist] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
