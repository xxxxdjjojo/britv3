import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/require-auth";
import { createAdminClient } from "@/lib/supabase/admin";

// ---------------------------------------------------------------------------
// GET /api/settings/login-history?page=1&per_page=10
// Returns paginated login history from auth.audit_log_entries.
// Uses service-role client since auth schema is not accessible via anon key.
// Gracefully falls back if the table is inaccessible.
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const { user, error: authError } = await requireAuth();

  if (authError || !user) {
    return authError ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const perPage = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("per_page") ?? "10", 10) || 10),
  );
  const offset = (page - 1) * perPage;

  try {
    const admin = createAdminClient();

    const { data, error, count } = await admin
      .schema("auth")
      .from("audit_log_entries")
      .select("id, ip_address, created_at, payload", { count: "exact" })
      .eq("actor_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + perPage - 1);

    if (error) {
      console.error("[login-history] query error:", error.message);
      return NextResponse.json({
        entries: [],
        total: 0,
        page,
        per_page: perPage,
        error: "unavailable",
      });
    }

    return NextResponse.json({
      entries: data ?? [],
      total: count ?? 0,
      page,
      per_page: perPage,
    });
  } catch (err) {
    console.error("[login-history] unexpected error:", err);
    return NextResponse.json({
      entries: [],
      total: 0,
      page,
      per_page: perPage,
      error: "unavailable",
    });
  }
}
