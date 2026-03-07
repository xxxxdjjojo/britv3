/**
 * Dashboard API route -- aggregated dashboard data and activity log.
 *
 * GET /api/dashboard           -- returns role-specific dashboard data (cached)
 * GET /api/dashboard?refresh=true  -- bypasses cache
 * GET /api/dashboard?activity=true&cursor=X  -- returns activity log
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getActivityLog,
  getDashboardData,
  invalidateDashboardCache,
} from "@/services/dashboard/dashboard-service";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Authenticate
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's active role from profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("active_role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: "Profile not found" },
      { status: 404 },
    );
  }

  const searchParams = request.nextUrl.searchParams;

  // Activity log mode
  if (searchParams.get("activity") === "true") {
    const cursor = searchParams.get("cursor") ?? undefined;
    const limit = Math.min(
      Number(searchParams.get("limit") ?? 20),
      100,
    );

    const result = await getActivityLog(supabase, user.id, cursor, limit);

    return NextResponse.json(result);
  }

  // Dashboard data mode
  const refresh = searchParams.get("refresh") === "true";

  if (refresh) {
    await invalidateDashboardCache(user.id);
  }

  const result = await getDashboardData(supabase, user.id, profile.active_role);

  return NextResponse.json(result);
}
