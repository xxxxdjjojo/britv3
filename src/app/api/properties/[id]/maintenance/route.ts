import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getMaintenanceRequests,
  createMaintenanceRequest,
} from "@/services/landlord/maintenance-service";
import type { MaintenanceStatus, MaintenancePriority } from "@/types/landlord";
import { MAINTENANCE_STATUSES, MAINTENANCE_PRIORITIES } from "@/types/landlord";

/**
 * GET /api/properties/[id]/maintenance
 * List maintenance requests for a property, with optional status/priority filters.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: propertyId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status") as MaintenanceStatus | null;
    const priority = searchParams.get("priority") as MaintenancePriority | null;

    // Validate filter values if provided
    if (status && !MAINTENANCE_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status: ${status}` },
        { status: 400 },
      );
    }
    if (priority && !MAINTENANCE_PRIORITIES.includes(priority)) {
      return NextResponse.json(
        { error: `Invalid priority: ${priority}` },
        { status: 400 },
      );
    }

    const requests = await getMaintenanceRequests(supabase, propertyId, {
      status: status ?? undefined,
      priority: priority ?? undefined,
    });

    return NextResponse.json(requests);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/properties/[id]/maintenance
 * Create a new maintenance request.
 * Photos are uploaded separately via client-side Supabase Storage SDK.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: propertyId } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const record = await createMaintenanceRequest(supabase, propertyId, {
      ...body,
      reported_by: user.id,
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("required") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
