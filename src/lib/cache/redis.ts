/**
 * Upstash Redis client singleton with cache helper functions.
 * Degrades gracefully when env vars are not configured.
 */

import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// ---------------------------------------------------------------------------
// Client singleton
// ---------------------------------------------------------------------------

let _redis: Redis | null = null;

function getRedisClient(): Redis | null {
  if (_redis) return _redis;

  const url = process.env.UPSTASH_REDIS_URL;
  const token = process.env.UPSTASH_REDIS_TOKEN;

  if (!url || !token) {
    console.warn(
      "[redis] UPSTASH_REDIS_URL or UPSTASH_REDIS_TOKEN not set -- using no-op fallback",
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
