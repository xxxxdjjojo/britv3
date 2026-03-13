import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { providerSearchSchema } from "@/lib/validators/marketplace-schemas";
import type { ProviderSearchInput } from "@/lib/validators/marketplace-schemas";
import {
  searchProviders,
} from "@/services/marketplace/provider-service";
import type { ProviderSearchResult } from "@/services/marketplace/provider-service";
import { Redis } from "@upstash/redis";

const CACHE_TTL_SECONDS = 300; // 5 minutes

// Lazy-initialise Redis — only created once per Lambda warm instance.
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null; // Redis not configured — degrade gracefully (no cache)
  }
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

function buildCacheKey(params: ProviderSearchInput): string {
  // Stable serialisation: sort keys so param order doesn't matter
  const sorted = (Object.keys(params) as Array<keyof ProviderSearchInput>)
    .sort()
    .reduce<Record<string, unknown>>((acc, k) => {
      acc[k as string] = params[k];
      return acc;
    }, {});
  return `provider-search:v1:${JSON.stringify(sorted)}`;
}

/**
 * GET /api/providers/search
 * Public endpoint -- search for verified service providers.
 * Results are cached in Redis for 5 minutes per unique param combination.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    // Parse query params with type coercion
    const rawParams: Record<string, unknown> = {};

    const category = searchParams.get("service_category");
    if (category) rawParams.service_category = category;

    const postcode = searchParams.get("postcode");
    if (postcode) rawParams.postcode = postcode;

    const radius = searchParams.get("radius");
    if (radius) rawParams.radius = Number(radius);

    const minRating = searchParams.get("min_rating");
    if (minRating) rawParams.min_rating = Number(minRating);

    const searchQuery = searchParams.get("search_query");
    if (searchQuery) rawParams.search_query = searchQuery;

    // Validate
    const parseResult = providerSearchSchema.safeParse(rawParams);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const cacheKey = buildCacheKey(parseResult.data);
    const client = getRedis();

    // Check cache
    if (client) {
      const cached = await client.get<ProviderSearchResult>(cacheKey);
      if (cached) {
        return NextResponse.json(cached, {
          status: 200,
          headers: {
            "Cache-Control": `public, max-age=${CACHE_TTL_SECONDS}, stale-while-revalidate=60`,
            "X-Cache": "HIT",
          },
        });
      }
    }

    // Cache miss — query DB
    const supabase = await createClient();
    const result = await searchProviders(supabase, parseResult.data);

    // Populate cache (fire-and-forget — don't block response on cache write)
    if (client) {
      client.setex(cacheKey, CACHE_TTL_SECONDS, result).catch((err: unknown) => {
        console.warn("Redis cache write failed (non-fatal):", err);
      });
    }

    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Cache-Control": `public, max-age=${CACHE_TTL_SECONDS}, stale-while-revalidate=60`,
        "X-Cache": "MISS",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
