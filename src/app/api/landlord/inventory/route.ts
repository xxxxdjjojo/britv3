/**
 * POST /api/landlord/inventory — create a new inventory report
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createInventoryReport } from "@/services/landlord/inventory-service";
import type { InventoryReport } from "@/types/landlord";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = (await request.json()) as Omit<
      InventoryReport,
      "id" | "created_at"
    >;

    // Validate required fields
    if (!body.property_id || !body.type) {
      return NextResponse.json(
        { error: "property_id and type are required" },
        { status: 400 },
      );
    }

    if (!["check_in", "check_out"].includes(body.type)) {
      return NextResponse.json(
        { error: "type must be check_in or check_out" },
        { status: 400 },
      );
    }

    const report = await createInventoryReport(supabase, {
      property_id: body.property_id,
      // landlord_id is overwritten server-side by createInventoryReport using auth user
      landlord_id: body.landlord_id ?? "",
      tenancy_id: body.tenancy_id ?? null,
      type: body.type,
      status: body.status ?? "draft",
      rooms: body.rooms ?? [],
      notes: body.notes ?? null,
      photo_urls: body.photo_urls ?? [],
      completed_at: body.completed_at ?? null,
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status = message === "Authentication required" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
