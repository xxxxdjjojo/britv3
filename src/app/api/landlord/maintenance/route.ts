import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getPortfolioMaintenanceRequests,
  createMaintenanceRequest,
} from "@/services/landlord/maintenance-service";
import type { MaintenanceStatus, MaintenancePriority } from "@/types/landlord";

/**
 * GET /api/landlord/maintenance
 * Portfolio-wide maintenance inbox. Returns all requests across the landlord's
 * properties, sorted by priority then date. Supports optional ?status= and
 * ?priority= query params.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as MaintenanceStatus | null;
    const priority = searchParams.get("priority") as MaintenancePriority | null;

    const requests = await getPortfolioMaintenanceRequests(supabase, {
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
 * POST /api/landlord/maintenance
 * Create a new maintenance request. Requires { property_id, title, description,
 * priority?, tenancy_id? } in the body.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { property_id, title, description, priority, tenancy_id } = body;

    if (!property_id || !title || !description) {
      return NextResponse.json(
        { error: "property_id, title, and description are required" },
        { status: 400 },
      );
    }

    const record = await createMaintenanceRequest(supabase, property_id, {
      title,
      description,
      priority,
      reported_by: user.id,
      tenancy_id: tenancy_id ?? null,
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("required") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
