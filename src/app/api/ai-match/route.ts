/**
 * /api/ai-match
 *
 * GET  — return stored preferences + non-expired match results
 * POST — save preferences then trigger Claude match analysis
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getMatchPreferences,
  saveMatchPreferences,
  getMatchResults,
  runMatchAnalysis,
  type AiMatchPreferences,
} from "@/services/ai/ai-match-service";

// ---------------------------------------------------------------------------
// GET /api/ai-match
// ---------------------------------------------------------------------------

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [preferences, results] = await Promise.all([
    getMatchPreferences(supabase, user.id),
    // Fetch ALL results (including expired) to determine resultsExpired flag
    supabase
      .from("ai_match_results")
      .select("id, expires_at")
      .eq("user_id", user.id),
  ]);

  const allResults = results.data ?? [];
  const now = new Date();

  // resultsExpired: there are rows but every one of them is past expires_at
  const hasAnyResults = allResults.length > 0;
  const hasValidResults = allResults.some(
    (r) => new Date(r.expires_at as string) > now,
  );
  const resultsExpired = hasAnyResults && !hasValidResults;

  // Fresh results (non-expired) for the response
  const freshResults = await getMatchResults(supabase, user.id);

  return NextResponse.json({
    preferences,
    results: freshResults,
    resultsExpired,
  });
}

// ---------------------------------------------------------------------------
// POST /api/ai-match
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Partial<AiMatchPreferences>;
  try {
    body = (await req.json()) as Partial<AiMatchPreferences>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Normalise / coerce incoming values
  const prefsPayload: Omit<AiMatchPreferences, "id" | "user_id" | "updated_at"> = {
    location: body.location ?? null,
    budget_min: body.budget_min ?? null,
    budget_max: body.budget_max ?? null,
    bedrooms_min: body.bedrooms_min ?? null,
    bedrooms_max: body.bedrooms_max ?? null,
    must_haves: Array.isArray(body.must_haves) ? body.must_haves : [],
    lifestyle_factors:
      body.lifestyle_factors &&
      typeof body.lifestyle_factors === "object" &&
      !Array.isArray(body.lifestyle_factors)
        ? (body.lifestyle_factors as Record<string, string>)
        : {},
  };

  // 1. Save preferences
  const saved = await saveMatchPreferences(supabase, user.id, prefsPayload);
  if (!saved) {
    return NextResponse.json(
      { error: "Failed to save preferences" },
      { status: 500 },
    );
  }

  // 2. Run analysis
  const analysisResult = await runMatchAnalysis(supabase, user.id, saved);

  if ("error" in analysisResult) {
    return NextResponse.json({ error: analysisResult.error }, { status: 500 });
  }

  if ("cached" in analysisResult) {
    return NextResponse.json({ success: true, cached: true, count: 0 });
  }

  return NextResponse.json({
    success: true,
    cached: false,
    count: analysisResult.count,
  });
}
