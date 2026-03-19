/**
 * GET /api/search/instant?q=<query>
 *
 * Lightweight typeahead autocomplete for property search.
 * Returns top 10 matching listings (title, slug, price only).
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCached, setCache, createRateLimiter } from "@/lib/cache/redis";
import { singleFlight } from "@/lib/search/single-flight";

export const dynamic = "force-dynamic";

type InstantResult = {
  listing_id: string;
  title: string;
  slug: string | null;
  price: number;
  city: string;
  property_type: string;
};

const CACHE_TTL = 5 * 60;
const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 10;

const limiter = createRateLimiter(60, "1 m");

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim().toLowerCase() ?? "";

  if (query.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({ results: [] });
  }

  const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
  const { success } = await limiter.limit(`instant:${ip}`);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 },
    );
  }

  const cacheKey = `instant:${query}`;
  const cached = await getCached<InstantResult[]>(cacheKey);
  if (cached) {
    return NextResponse.json({ results: cached });
  }

  const results = await singleFlight(cacheKey, async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("search_listings")
      .select("listing_id, title, slug, price, city, property_type")
      .ilike("title", `${query}%`)
      .limit(MAX_RESULTS);

    if (error) {
      console.error("[instant-search] Query failed:", error.message);
      return [] as InstantResult[];
    }

    return (data ?? []) as InstantResult[];
  });

  await setCache(cacheKey, results, CACHE_TTL);

  return NextResponse.json({ results });
}
