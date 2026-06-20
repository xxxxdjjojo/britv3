/**
 * GET /api/market-map/card
 *
 * Returns the instant area card (flat + house price bands, prices in pounds)
 * for one area, read straight from the market-map precompute via the
 * market_map_area_card RPC. CDN-cached via Cache-Control headers.
 *
 * Query params:
 *   level    geography level (local_authority|postcode_district|msoa|lsoa|street) — required
 *   area_id  area code — required, non-empty
 *   window   rolling-window months (default 12)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAreaCard } from "@/services/market-map/area-detail-service";
import { GEOGRAPHY_LEVELS } from "@/lib/market-map/geography";

const querySchema = z.object({
  level: z.enum(GEOGRAPHY_LEVELS as unknown as [string, ...string[]]),
  area_id: z.string().min(1),
  window: z.coerce.number().int().optional().default(12),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const rawParams: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    rawParams[key] = value;
  });

  const parsed = querySchema.safeParse(rawParams);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { level, area_id, window } = parsed.data;

  const card = await getAreaCard(level, area_id, window);

  const response = NextResponse.json(card);
  response.headers.set(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=600",
  );
  return response;
}
