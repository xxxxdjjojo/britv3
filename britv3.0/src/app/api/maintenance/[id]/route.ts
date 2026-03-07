import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getMaintenanceRequest,
  updateMaintenanceRequest,
} from "@/services/landlord/maintenance-service";

/**
 * GET /api/maintenance/[id]
 * Get a single maintenance request by ID.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: requestId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const record = await getMaintenanceRequest(supabase, requestId);
    return NextResponse.json(record);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/**
 * PATCH /api/maintenance/[id]
 * Update a maintenance request -- handles status transitions, provider
 * assignment, and resolution.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: requestId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const updated = await updateMaintenanceRequest(supabase, requestId, {
      status: body.status,
      assigned_provider_id: body.assigned_provider_id,
      assigned_provider_name: body.assigned_provider_name,
      resolution_notes: body.resolution_notes,
    });

    return NextResponse.json(updated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("Invalid status transition")
      ? 422
      : message.includes("required")
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
