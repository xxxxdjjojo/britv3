import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/gdpr/cancel-deletion
 * Cancels a pending account deletion by clearing scheduled_deletion_at
 * on profiles and updating the deletion_requests table.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 },
    );
  }

  try {
    // Check if there's actually a pending deletion
    const { data: profile } = await supabase
      .from("profiles")
      .select("scheduled_deletion_at")
      .eq("id", user.id)
      .single();

    if (!profile?.scheduled_deletion_at) {
      return NextResponse.json(
        { error: "No pending deletion to cancel" },
        { status: 409 },
      );
    }

    // Clear scheduled_deletion_at on the profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ scheduled_deletion_at: null })
      .eq("id", user.id);

    if (profileError) {
      return NextResponse.json(
        { error: "Failed to cancel deletion" },
        { status: 500 },
      );
    }

    // Cancel any pending deletion requests
    const { error: reqError } = await supabase
      .from("deletion_requests")
      .update({ status: "cancelled" })
      .eq("user_id", user.id)
      .eq("status", "pending");

    if (reqError) {
      console.error("[cancel-deletion] Failed to update deletion_requests:", reqError);
    }

    // Audit log the cancellation
    const { error: auditError } = await supabase.from("auth_audit_log").insert({
      user_id: user.id,
      event_type: "deletion_cancelled",
      ip_address: null,
    });

    if (auditError) {
      console.error("[cancel-deletion] Failed to write audit log:", auditError);
    }

    return NextResponse.json({
      message: "Account deletion cancelled successfully",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to cancel deletion" },
      { status: 500 },
    );
  }
}
