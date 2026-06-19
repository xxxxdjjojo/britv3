/**
 * Upstash Redis client singleton with cache helper functions.
 * Degrades gracefully when env vars are not configured.
 */

import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { createInMemoryRateLimiter } from "@/lib/rate-limit-memory";
import { captureException } from "@/lib/observability/capture-exception";

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

type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

type AuthRateLimiter = { limit: (identifier: string) => Promise<RateLimitResult> };

function parseWindowMs(w: string): number {
  const match = w.match(/^(\d+)\s*(ms|s|m|h|d)$/);
  if (!match) return 3_600_000;
  const n = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = { ms: 1, s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return n * (multipliers[unit] ?? 3_600_000);
}

/** A limiter that denies every request — used to fail CLOSED when Redis is unavailable in production. */
function denyAllLimiter(maxRequests: number, windowMs: number): AuthRateLimiter {
  return {
    limit: async () => ({ success: false, limit: maxRequests, remaining: 0, reset: Date.now() + windowMs }),
  };
}

/**
 * Create a sliding-window rate limiter for auth endpoints.
 * Default: 5 requests per hour.
 *
 * Fails CLOSED in production: when Redis is unavailable — whether unconfigured
 * (missing env) or erroring at request time — `.limit()` denies the request
 * (`success: false`). This preserves brute-force protection on sensitive auth
 * endpoints (login, signup, MFA verify, password reset, account deletion) at
 * the cost of availability during a Redis outage.
 *
 * In non-production (local dev, CI) it falls back to a per-instance in-memory
 * limiter so these endpoints work without Redis configured. Use
 * `createRateLimiter` for non-auth endpoints where fail-open is acceptable.
 */
export function createAuthRateLimiter(
  maxRequests = 5,
  windowMs: `${number} ms` | `${number} s` | `${number} m` | `${number} h` | `${number} d` = "1 h",
): AuthRateLimiter {
  const client = getRedisClient();
  if (!client) {
    if (process.env.NODE_ENV === "production") {
      captureException(
        new Error(
          "Auth rate limiter has no Redis in production — failing CLOSED. Configure UPSTASH_REDIS_REST_URL/TOKEN.",
        ),
        { module: "redis", operation: "createAuthRateLimiter" },
      );
      return denyAllLimiter(maxRequests, parseWindowMs(windowMs));
    }
    console.warn("[redis] Auth rate limiter falling back to in-memory — non-production only");
    return createInMemoryRateLimiter(maxRequests, parseWindowMs(windowMs));
  }

  const limiter = new Ratelimit({
    redis: client,
    limiter: Ratelimit.slidingWindow(maxRequests, windowMs),
    analytics: false,
  });

  // Wrap so a Redis outage at request time fails CLOSED (deny) instead of
  // throwing — an uncaught throw here would surface as a 500 and let the
  // request bypass rate limiting on retry.
  return {
    limit: async (identifier: string) => {
      try {
        return await limiter.limit(identifier);
      } catch (err) {
        captureException(err, { module: "redis", operation: "authRateLimiter.limit" });
        return { success: false, limit: maxRequests, remaining: 0, reset: Date.now() + parseWindowMs(windowMs) };
      }
    },
  };
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
  crime: (postcode: string) => `crime:postcode:${postcode}`,
  demographics: (postcodeDistrict: string) =>
    `demo:postcode_district:${postcodeDistrict}`,
};
