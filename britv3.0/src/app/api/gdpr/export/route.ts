import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exportUserData } from "@/services/gdpr/export-service";

/**
 * GET /api/gdpr/export
 * Returns a JSON file download containing all user data (GDPR Subject Access Request).
 */
export async function GET() {
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
    const exportData = await exportUserData(user.id);
    const jsonString = JSON.stringify(exportData, null, 2);
    const date = new Date().toISOString().split("T")[0];

    // Log the export event
    await supabase.from("auth_audit_log").insert({
      user_id: user.id,
      event_type: "data_export",
      ip_address: null,
    });

    return new Response(jsonString, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="britestate-data-export-${date}.json"`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 },
    );
  }
}
