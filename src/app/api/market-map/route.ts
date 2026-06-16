/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException */
/**
 * GET /api/market-map
 *
 * Returns a GeoJSON FeatureCollection (choropleth areas + metadata) for the
 * market-price map. Responses are cached in Upstash Redis (TTL 300 s) and
 * CDN-cached via Cache-Control headers.
 *
 * Query params (all optional):
 *   bbox             "w,s,e,n" — viewport bounding box in WGS-84 degrees
 *   area_id          specific area code (alternative to bbox)
 *   zoom             MapLibre zoom level (used to derive geography_level)
 *   geography_level  explicit level override (local_authority|postcode_district|msoa|lsoa|street)
 *   property_type    all|detached|semi-detached|terraced|flat  (default: all)
 *   from_date        ISO date string (start of date window)
 *   to_date          ISO date string (end of date window)
 *   months           12|24|36|60 (alternative to from_date/to_date; default: 36)
 *   scale_mode       national|local  (default: national)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCached, setCache } from "@/lib/cache/redis";
import { getMarketMapFeatures } from "@/services/market-map/market-map-service";
import { getMicroAreaFeatures } from "@/services/market-map/micro-area-service";
import { geographyLevelForZoom, GEOGRAPHY_LEVELS } from "@/lib/market-map/geography";
import type { GeographyLevel } from "@/lib/market-map/geography";
import type { MarketMapFilters } from "@/services/market-map/types";

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const PROPERTY_TYPES = ["all", "detached", "semi-detached", "terraced", "flat"] as const;
const MONTHS_VALUES = ["12", "24", "36", "60"] as const;
const SCALE_MODES = ["national", "local"] as const;

const querySchema = z.object({
  bbox: z
    .string()
    .optional()
    .transform((v) => {
      if (!v) return undefined;
      const parts = v.split(",").map(Number);
      if (
        parts.length !== 4 ||
        parts.some((n) => !isFinite(n))
      ) {
        throw new Error("bbox must be four comma-separated finite numbers");
      }
      return parts as [number, number, number, number];
    }),
  area_id: z.string().optional(),
  zoom: z.coerce.number().optional(),
  geography_level: z.enum(GEOGRAPHY_LEVELS as unknown as [string, ...string[]]).optional(),
  property_type: z.enum(PROPERTY_TYPES).optional().default("all"),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
  months: z.enum(MONTHS_VALUES).optional(),
  scale_mode: z.enum(SCALE_MODES).optional().default("national"),
});

type ParsedQuery = z.infer<typeof querySchema>;

// ---------------------------------------------------------------------------
// Date-window resolution
// ---------------------------------------------------------------------------

function resolveDateWindow(
  parsed: ParsedQuery,
): { fromDate: string; toDate: string } {
  const today = new Date();

  if (parsed.from_date && parsed.to_date) {
    return { fromDate: parsed.from_date, toDate: parsed.to_date };
  }

  const toDate = today.toISOString().slice(0, 10);

  if (parsed.months) {
    const monthsBack = parseInt(parsed.months, 10);
    const from = new Date(today);
    from.setMonth(from.getMonth() - monthsBack);
    return { fromDate: from.toISOString().slice(0, 10), toDate };
  }

  // Default: 36 months
  const from = new Date(today);
  from.setMonth(from.getMonth() - 36);
  return { fromDate: from.toISOString().slice(0, 10), toDate };
}

// ---------------------------------------------------------------------------
// Cache key
// ---------------------------------------------------------------------------

function buildCacheKey(
  level: GeographyLevel,
  propertyType: string,
  fromDate: string,
  toDate: string,
  scaleMode: string,
  bbox: [number, number, number, number] | undefined,
  areaId: string | undefined,
): string {
  const bboxPart = bbox ? bbox.join(",") : "none";
  const areaPart = areaId ?? "none";
  return `market-map:${level}:${propertyType}:${fromDate}:${toDate}:${scaleMode}:${bboxPart}:${areaPart}`;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

const CACHE_TTL_SECONDS = 300;

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

  const q = parsed.data;

  // Resolve geography level: explicit param > zoom-derived > default.
  const geographyLevel: GeographyLevel = (q.geography_level as GeographyLevel | undefined)
    ?? geographyLevelForZoom(q.zoom ?? 6);

  // Resolve date window.
  const { fromDate, toDate } = resolveDateWindow(q);

  // Build cache key from all resolved params.
  const cacheKey = buildCacheKey(
    geographyLevel,
    q.property_type,
    fromDate,
    toDate,
    q.scale_mode,
    q.bbox,
    q.area_id,
  );

  // Try cache first.
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
    // Cache miss on error — continue to fetch from DB.
    console.error("[market-map] Redis read error (continuing without cache):", err);
  }

  // Build filters and call the service.
  const filters: MarketMapFilters = {
    geographyLevel,
    propertyType: q.property_type,
    fromDate,
    toDate,
    scaleMode: q.scale_mode,
    ...(q.bbox !== undefined ? { bbox: q.bbox } : {}),
  };

  // Street level uses H3 hex-cell aggregation (micro-area layer).
  // All other levels use the polygon choropleth path.
  const featureCollection =
    geographyLevel === "street"
      ? await getMicroAreaFeatures(filters)
      : await getMarketMapFeatures(filters);

  // Write to cache (best-effort — never throws).
  try {
    await setCache(cacheKey, featureCollection, CACHE_TTL_SECONDS);
  } catch (err) {
    console.error("[market-map] Redis write error (response still served):", err);
  }

  const response = NextResponse.json(featureCollection);
  response.headers.set(
    "Cache-Control",
    "public, s-maxage=300, stale-while-revalidate=600",
  );
  return response;
}
