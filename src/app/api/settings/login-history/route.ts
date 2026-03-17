import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/require-auth";
import { createAdminClient } from "@/lib/supabase/admin";

// ---------------------------------------------------------------------------
// GET /api/settings/login-history?page=1&limit=10
// Returns paginated login history from auth.audit_log_entries.
// Falls back gracefully if the table is inaccessible.
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const { user } = auth;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10)));
  const offset = (page - 1) * limit;

  try {
    const admin = createAdminClient();

    const { data: entries, error } = await admin
      .schema("auth")
      .from("audit_log_entries")
      .select("id, payload, ip_address, created_at")
      .eq("actor_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      // Table may not be accessible — return graceful fallback
      console.warn("login-history: audit_log_entries query failed:", error.message);
      return NextResponse.json({ entries: [], fallback: true });
    }

    const formatted = (entries ?? []).map((entry) => {
      const payload = (typeof entry.payload === "object" ? entry.payload : {}) as Record<string, unknown>;
      return {
        id: entry.id as string,
        created_at: entry.created_at as string,
        ip_address: (entry.ip_address as string) ?? null,
        action: (payload.action as string) ?? "unknown",
        user_agent: (payload.traits as Record<string, unknown>)?.user_agent as string | null ?? null,
      };
    });

    return NextResponse.json({ entries: formatted, fallback: false, page, limit });
  } catch (err) {
    console.warn("login-history: unexpected error:", err);
    return NextResponse.json({ entries: [], fallback: true });
  }
}
