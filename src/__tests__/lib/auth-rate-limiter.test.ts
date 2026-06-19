import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * createAuthRateLimiter must FAIL CLOSED in production when Redis is
 * unavailable (issue #56), while keeping a usable in-memory fallback in
 * non-production (local dev / CI, where no Upstash env is configured).
 *
 * Each test resets modules so the redis.ts client singleton (`_redis`) starts
 * null and re-reads the stubbed env. `captureException` is mocked via a hoisted
 * ref so the same spy survives module resets.
 */
const captureExceptionMock = vi.hoisted(() => vi.fn());
vi.mock("@/lib/observability/capture-exception", () => ({
  captureException: captureExceptionMock,
}));

describe("createAuthRateLimiter", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    captureExceptionMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.doUnmock("@upstash/ratelimit");
    vi.doUnmock("@upstash/redis");
  });

  it("falls back to an in-memory limiter outside production when Redis is unconfigured", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    const { createAuthRateLimiter } = await import("@/lib/cache/redis");

    const limiter = createAuthRateLimiter(2, "1 m");
    expect((await limiter.limit("k")).success).toBe(true); // 1st allowed
    expect((await limiter.limit("k")).success).toBe(true); // 2nd allowed
    expect((await limiter.limit("k")).success).toBe(false); // 3rd denied — in-memory works
    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it("fails CLOSED in production when Redis is unconfigured (no in-memory bypass)", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    const { createAuthRateLimiter } = await import("@/lib/cache/redis");

    const limiter = createAuthRateLimiter(5, "1 h");
    const res = await limiter.limit("attacker");
    expect(res.success).toBe(false); // denied on the very first request
    expect(captureExceptionMock).toHaveBeenCalled(); // reported to Sentry, not silent
  });

  it("fails CLOSED when the Redis-backed limiter throws at request time", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://fake.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "fake-token");

    vi.doMock("@upstash/redis", () => {
      function Redis() {
        return {};
      }
      return { Redis };
    });
    vi.doMock("@upstash/ratelimit", () => {
      class Ratelimit {
        static slidingWindow() {
          return {};
        }
        async limit() {
          throw new Error("redis connection refused");
        }
      }
      return { Ratelimit };
    });

    const { createAuthRateLimiter } = await import("@/lib/cache/redis");
    const limiter = createAuthRateLimiter(5, "1 h");
    const res = await limiter.limit("attacker"); // must NOT throw (would be a 500)
    expect(res.success).toBe(false); // outage → deny
    expect(captureExceptionMock).toHaveBeenCalled();
  });
});
