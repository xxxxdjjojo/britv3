/* eslint-disable no-console -- matches market-map route console.error pattern */
/**
 * GET /api/market-map/area/[level]/[areaId]
 *
 * Returns the sold-price breakdown for a single area, split into overall /
 * flats / houses, for the selected-area detail panel. Cached in Upstash Redis
 * (TTL 300 s) and CDN-cached.
 *
 *   level    one of: local_authority | postcode_district | postcode_sector | msoa | lsoa | street
 *   areaId   the area identifier at that level (e.g. LAD code, MSOA code, district string)
 *
 * Query params (all optional):
 *   from_date  ISO date (start of window)
 *   to_date    ISO date (end of window)
 *   months     12|24|36|60 (alternative; default: 36)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCached, setCache } from "@/lib/cache/redis";
import { getAreaDetail } from "@/services/market-map/area-detail-service";

const DETAIL_LEVELS = [
  "local_authority",
  "postcode_district",
  "postcode_sector",
  "msoa",
  "lsoa",
  "street",
] as const;

const MONTHS_VALUES = ["12", "24", "36", "60"] as const;

const querySchema = z.object({
  from_date: z.string().optional(),
  to_date: z.string().optional(),
  months: z.enum(MONTHS_VALUES).optional(),
});

function resolveDateWindow(
  q: z.infer<typeof querySchema>,
): { fromDate: string; toDate: string } {
  const today = new Date();
  if (q.from_date && q.to_date) {
    return { fromDate: q.from_date, toDate: q.to_date };
  }
  const toDate = today.toISOString().slice(0, 10);
  const monthsBack = q.months ? parseInt(q.months, 10) : 36;
  const from = new Date(today);
  from.setMonth(from.getMonth() - monthsBack);
  return { fromDate: from.toISOString().slice(0, 10), toDate };
}

const CACHE_TTL_SECONDS = 300;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ level: string; areaId: string }> },
): Promise<NextResponse> {
  const { level, areaId: rawAreaId } = await params;
  const areaId = decodeURIComponent(rawAreaId);

  if (!(DETAIL_LEVELS as readonly string[]).includes(level)) {
    return NextResponse.json(
      { error: `Invalid geography level '${level}'` },
      { status: 400 },
    );
  }

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

  const { fromDate, toDate } = resolveDateWindow(parsed.data);
  const cacheKey = `market-map-detail:${level}:${areaId}:${fromDate}:${toDate}`;

  try {
    const cached = await getCached<unknown>(cacheKey);
    if (cached !== null) {
      const response = NextResponse.json(cached);
      response.headers.set(
        "Cache-Control",
        "public, s-maxage=300, stale-while-revalidate=600",
      );
      return response;
    }
  } catch (err) {
    console.error("[market-map-detail] Redis read error (continuing):", err);
  }

  const detail = await getAreaDetail(level, areaId, fromDate, toDate);
  if (detail === null) {
    return NextResponse.json(
      { error: "Area detail unavailable" },
      { status: 404 },
    );
  }

  try {
    await setCache(cacheKey, detail, CACHE_TTL_SECONDS);
  } catch (err) {
    console.error("[market-map-detail] Redis write error (response served):", err);
  }

  const response = NextResponse.json(detail);
  response.headers.set(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=600",
  );
  return response;
}
