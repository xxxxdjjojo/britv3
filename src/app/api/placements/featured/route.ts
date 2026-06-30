/**
 * GET /api/placements/featured
 *
 * Public endpoint returning ranked Featured Local Experts for a location and
 * (optionally) a buyer-journey stage or explicit categories. Used by the
 * property page, search grid, and area pages. The RPC is SECURITY DEFINER so
 * this works for logged-out visitors without exposing competitor data.
 */

import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { categoriesForStage, type PlacementStage } from "@/lib/placements/relevance";
import { getFeaturedExperts } from "@/services/placements/placement-service";

function postcodeDistrict(postcode: string | null): string | null {
  if (!postcode) return null;
  const trimmed = postcode.trim().toUpperCase();
  return trimmed.split(" ")[0] || null;
}

const VALID_STAGES: PlacementStage[] = ["buy", "rent", "renovation"];

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const stageParam = params.get("stage");
  const stage = VALID_STAGES.includes(stageParam as PlacementStage) ? (stageParam as PlacementStage) : null;
  const categoriesParam = params.get("categories");

  const categories = categoriesParam
    ? categoriesParam.split(",").map((c) => c.trim()).filter(Boolean)
    : stage
      ? categoriesForStage(stage)
      : null;

  const limitRaw = Number.parseInt(params.get("limit") ?? "3", 10);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 6) : 3;

  try {
    const supabase = await createClient();
    const experts = await getFeaturedExperts(supabase, {
      postcodeDistrict: postcodeDistrict(params.get("postcode")),
      town: params.get("town"),
      region: params.get("region"),
      categories,
      limit,
    });
    return NextResponse.json({ experts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load featured experts";
    return NextResponse.json({ experts: [], error: message }, { status: 500 });
  }
}
