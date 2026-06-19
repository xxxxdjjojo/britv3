/**
 * Upstash Redis client singleton with cache helper functions.
 * Degrades gracefully when env vars are not configured.
 */

import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { createInMemoryRateLimiter } from "@/lib/rate-limit-memory";

// ---------------------------------------------------------------------------
// Client singleton
// ---------------------------------------------------------------------------

let _redis: Redis | null = null;

function getRedisClient(): Redis | null {
  if (_redis) return _redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn(
      "[redis] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set -- using no-op fallback",
    );
    return null;
  }

  _redis = new Redis({ url, token });
  return _redis;
}

/** Lazily-initialized Redis client. May be null if env vars missing. */
export const redis = getRedisClient();

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------

/**
 * Get a cached value by key. Returns null on cache miss or if Redis
 * is not configured.
 */
export async function getCached<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client) return null;

  const value = await client.get<T>(key);
  return value ?? null;
}

/**
 * Set a cache entry with a TTL (seconds).
 */
export async function setCache(
  key: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  await client.setex(key, ttlSeconds, value);
}

/**
 * Delete a single cache key.
 */
export async function invalidateCache(key: string): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  await client.del(key);
}

/**
 * Delete all keys matching a glob pattern (e.g. `dashboard:*`).
 * Uses SCAN to avoid blocking the server.
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  let cursor = "0";

  do {
    const result = await client.scan(Number(cursor), {
      match: pattern,
      count: 100,
    });
    cursor = String(result[0]);
    const keys = result[1] as string[];

    if (keys.length > 0) {
      await client.del(...keys);
    }
  } while (cursor !== "0");
}

// ---------------------------------------------------------------------------
// Rate limiter factory
// ---------------------------------------------------------------------------

/**
 * Create a sliding-window rate limiter.
 * Default: 5 requests per hour (for email rate limiting).
 *
 * Fails OPEN: when Redis is unavailable all requests are allowed through.
 * Use this for non-critical endpoints where availability > security.
 * For auth endpoints use `createAuthRateLimiter` instead.
 */
export function createRateLimiter(
  maxRequests = 5,
  windowMs: `${number} ms` | `${number} s` | `${number} m` | `${number} h` | `${number} d` = "1 h",
) {
  const client = getRedisClient();
  if (!client) {
    // Return a no-op limiter that always allows
    return {
      limit: async (_identifier: string) => ({
        success: true,
        limit: maxRequests,
        remaining: maxRequests - 1,
        reset: Date.now() + 3_600_000,
      }),
    };
  }

  return new Ratelimit({
    redis: client,
    limiter: Ratelimit.slidingWindow(maxRequests, windowMs),
    analytics: false,
  });
}

/**
 * Create a sliding-window rate limiter for auth endpoints.
 * Default: 5 requests per hour.
 *
 * Fails CLOSED: when Redis is unavailable ALL requests are denied.
 * This preserves brute-force protection on sensitive auth endpoints
 * (login, signup, MFA verify, password reset) at the cost of
 * availability during a Redis outage. Use `createRateLimiter` for
 * non-auth endpoints where fail-open behaviour is acceptable.
 */
function parseWindowMs(w: string): number {
  const match = w.match(/^(\d+)\s*(ms|s|m|h|d)$/);
  if (!match) return 3_600_000;
  const n = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = { ms: 1, s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return n * (multipliers[unit] ?? 3_600_000);
}

export function createAuthRateLimiter(
  maxRequests = 5,
  windowMs: `${number} ms` | `${number} s` | `${number} m` | `${number} h` | `${number} d` = "1 h",
) {
  const client = getRedisClient();
  if (!client) {
    console.warn("[redis] Auth rate limiter falling back to in-memory — per-instance only");
    return createInMemoryRateLimiter(maxRequests, parseWindowMs(windowMs));
  }

  return new Ratelimit({
    redis: client,
    limiter: Ratelimit.slidingWindow(maxRequests, windowMs),
    analytics: false,
  });
}

// ---------------------------------------------------------------------------
// Property detail cache — TTL constants and key builders
// ---------------------------------------------------------------------------

export const PROPERTY_DETAIL_TTL = {
  /** Property row — 5 minutes */
  PROPERTY: 5 * 60,
  /** Land Registry comparables — 24 hours */
  LAND_REGISTRY: 24 * 60 * 60,
  /** ROI estimate — 24 hours */
  ROI: 24 * 60 * 60,
  /** Ofsted schools data — 7 days */
  OFSTED: 7 * 24 * 60 * 60,
  /** EPC certificates — 30 days (EPCs are valid for 10 years) */
  EPC: 30 * 24 * 60 * 60,
  /** Crime stats — 24 hours */
  CRIME: 24 * 60 * 60,
  /** Area demographics — 7 days */
  DEMOGRAPHICS: 7 * 24 * 60 * 60,
} as const;

/** Key builders for property detail cache entries. */
export const propertyDetailCacheKey = {
  property: (slug: string) => `prop:slug:${slug}`,
  landRegistry: (postcode: string) => `lr:postcode:${postcode}`,
  roi: (postcode: string, propType: string, priceBand: string) =>
    `roi:${postcode}:${propType}:${priceBand}`,
  ofsted: (lat: number, lng: number, radius: number) =>
    `ofsted:lat:${lat.toFixed(4)}:lng:${lng.toFixed(4)}:r:${radius}`,
  epc: (postcode: string) => `epc:postcode:${postcode.replace(/\s+/g, "").toUpperCase()}`,
  crime: (postcode: string) => `crime:postcode:${postcode}`,
  demographics: (postcodeDistrict: string) =>
    `demo:postcode_district:${postcodeDistrict}`,
};
