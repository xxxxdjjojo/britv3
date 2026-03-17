import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exportUserData } from "@/services/gdpr/export-service";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

/**
 * Rate limiter: 1 GDPR export per hour per user.
 * Degrades gracefully when Upstash env vars are missing.
 */
function getExportRateLimiter() {
  const url = process.env.UPSTASH_REDIS_URL;
  const token = process.env.UPSTASH_REDIS_TOKEN;

  if (!url || !token) {
    // Degrade gracefully — always allow when Redis is not configured
    return {
      limit: async (_identifier: string) => ({
        success: true,
        limit: 1,
        remaining: 0,
        reset: Date.now() + 3_600_000,
      }),
    };
  }

  const redis = new Redis({ url, token });
  return new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(1, "1 h"),
    analytics: false,
  });
}

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
  const ratelimit = getExportRateLimiter();
  const { success: rateLimitOk } = await ratelimit.limit(
    `gdpr:export:${user.id}`,
  );
  if (!rateLimitOk) {
    return NextResponse.json(
      { error: "You can export your data once per hour. Please try again later." },
      { status: 429 },
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
