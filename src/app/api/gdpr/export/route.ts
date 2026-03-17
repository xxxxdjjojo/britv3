import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exportUserData } from "@/services/gdpr/export-service";
import { createRateLimiter } from "@/lib/cache/redis";

// 1 GDPR export per hour per user — gracefully degrades if Redis unavailable
const gdprExportLimiter = createRateLimiter(1, "1 h");

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

  // Rate limit: 1 export per hour per user
  try {
    const { success } = await gdprExportLimiter.limit(user.id);
    if (!success) {
      return NextResponse.json(
        { error: "You can only export your data once per hour." },
        { status: 429 },
      );
    }
  } catch {
    // Redis unavailable — skip rate limiting (graceful degradation)
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
