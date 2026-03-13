import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getMaintenanceRequest,
  updateMaintenanceRequest,
} from "@/services/landlord/maintenance-service";
import type { MaintenanceStatus } from "@/types/landlord";

/**
 * PATCH /api/landlord/maintenance/[id]/status
 * Update the status of a maintenance request.
 * Body: { status: MaintenanceStatus, resolution_notes?: string }
 *
 * Validates that the authenticated user owns the property associated with
 * the request before updating.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: requestId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status, resolution_notes } = body as {
      status: MaintenanceStatus;
      resolution_notes?: string;
    };

    if (!status) {
      return NextResponse.json(
        { error: "status is required" },
        { status: 400 },
      );
    }

    // Verify the request exists and belongs to this landlord (RLS enforces ownership)
    await getMaintenanceRequest(supabase, requestId);

    const updated = await updateMaintenanceRequest(supabase, requestId, {
      status,
      resolution_notes,
    });

    return NextResponse.json(updated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("not found")
      ? 404
      : message.includes("Invalid status")
        ? 422
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
