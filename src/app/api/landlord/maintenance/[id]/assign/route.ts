import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMaintenanceRequest } from "@/services/landlord/maintenance-service";

/**
 * PATCH /api/landlord/maintenance/[id]/assign
 * Assign a marketplace provider to a maintenance request.
 * Body: { provider_id: string }
 *
 * Sets assigned_provider_id + assigned_provider_name on the request and
 * auto-transitions status to 'in_progress' (via the service layer's state
 * machine if the request is in 'acknowledged' or 'assigned' status).
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
    const { provider_id } = body as { provider_id: string };

    if (!provider_id) {
      return NextResponse.json(
        { error: "provider_id is required" },
        { status: 400 },
      );
    }

    // Verify request exists (RLS enforces landlord ownership)
    await getMaintenanceRequest(supabase, requestId);

    // Fetch provider name for the denormalised field
    const { data: providerData, error: providerError } = await supabase
      .from("service_provider_details")
      .select("business_name")
      .eq("user_id", provider_id)
      .maybeSingle();

    if (providerError) {
      return NextResponse.json(
        { error: "Failed to fetch provider details" },
        { status: 500 },
      );
    }

    const providerName = providerData?.business_name ?? "Unknown provider";

    // Update maintenance request with assigned provider
    const { data: updated, error: updateError } = await supabase
      .from("maintenance_requests")
      .update({
        assigned_provider_id: provider_id,
        assigned_provider_name: providerName,
        // Auto-transition to in_progress when assigning
        status: "in_progress",
      })
      .eq("id", requestId)
      .select()
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: updateError?.message ?? "Failed to assign provider" },
        { status: 500 },
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
