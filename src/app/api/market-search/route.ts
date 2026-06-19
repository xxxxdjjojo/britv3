/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException */
/**
 * GET /api/market-search
 *
 * Resolves a free-text query to candidate geographic areas for the market-map
 * search bar. Responses are cached in Upstash Redis (TTL 600 s) and CDN-cached
 * via Cache-Control headers.
 *
 * Query params:
 *   q  (required) — search string, minimum 1 character after trim
 *
 * Responses:
 *   200 { results: MarketSearchResultDTO[] }
 *   400 { error: string, details: ... }  — missing or empty q param
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCached, setCache } from "@/lib/cache/redis";
import { searchAreas } from "@/services/market-map/search-service";

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const querySchema = z.object({
  q: z.string().min(1, "q must be at least 1 character"),
});

// ---------------------------------------------------------------------------
// Cache key
// ---------------------------------------------------------------------------

function buildCacheKey(q: string): string {
  // Normalise: lowercase, collapse whitespace. Keeps related queries in the
  // same cache slot (e.g. "Westminster" and "westminster").
  const normalised = q.toLowerCase().replace(/\s+/g, " ").trim();
  return `market-search:${normalised}`;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

const CACHE_TTL_SECONDS = 600;

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

  const { q } = parsed.data;

  // Empty after trim → return empty results (not a 400).
  if (!q.trim()) {
    return NextResponse.json({ results: [] });
  }

  const cacheKey = buildCacheKey(q);

  // Try cache first.
  try {
    const cached = await getCached<unknown>(cacheKey);
    if (cached !== null) {
      const response = NextResponse.json({ results: cached });
      response.headers.set(
        "Cache-Control",
        "public, s-maxage=600, stale-while-revalidate=1200",
      );
      return response;
    }
  } catch (err) {
    console.error("[market-search] Redis read error (continuing without cache):", err);
  }

  const results = await searchAreas(q);

  // Write to cache (best-effort — never throws).
  try {
    await setCache(cacheKey, results, CACHE_TTL_SECONDS);
  } catch (err) {
    console.error("[market-search] Redis write error (response still served):", err);
  }

  const response = NextResponse.json({ results });
  response.headers.set(
    "Cache-Control",
    "public, s-maxage=600, stale-while-revalidate=1200",
  );
  return response;
}
