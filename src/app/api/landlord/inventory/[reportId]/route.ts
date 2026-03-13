/**
 * GET  /api/landlord/inventory/[reportId] — fetch a single inventory report
 * PATCH /api/landlord/inventory/[reportId] — update an inventory report
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateInventoryReport } from "@/services/landlord/inventory-service";
import type { InventoryReport } from "@/types/landlord";

type RouteContext = { params: Promise<{ reportId: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { reportId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("inventory_reports")
      .select("*")
      .eq("id", reportId)
      .eq("landlord_id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Report not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { reportId } = await params;
    const supabase = await createClient();
    const body = (await request.json()) as Partial<InventoryReport>;

    // Prevent updating immutable fields (strip them via destructure, result goes into updates)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, landlord_id: _landlord, created_at: _created, ...updates } = body;

    const updated = await updateInventoryReport(supabase, reportId, updates);

    return NextResponse.json(updated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status = message === "Authentication required" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
