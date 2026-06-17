import { NextResponse } from "next/server";
import { z } from "zod";
import { parseMarketMapQuery } from "@/lib/market-map/query";
import { cached } from "@/lib/market-map/cache";
import { getMarketMap } from "@/services/market-map/market-map-service";

/**
 * GET /api/market-map
 *
 * Returns a GeoJSON FeatureCollection of median sold price by postcode district
 * for a borough, with a robust local colour scale. Public endpoint — the
 * underlying Land Registry data is public.
 *
 * Query params: area, geography_level, property_type, from_date, to_date
 * (or `months` as a shorthand window).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const query = parseMarketMapQuery(searchParams);
    const key = `market-map:${JSON.stringify(query)}`;
    const data = await cached(key, () => getMarketMap(query));
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: err.flatten() },
        { status: 400 },
      );
    }
    const message =
      err instanceof Error ? err.message : "Failed to build market map";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
