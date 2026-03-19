import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRedis } from "@/__tests__/mocks/redis";

// Mock the @upstash/redis module before importing our cache helpers
const mockRedis = createMockRedis();

vi.mock("@upstash/redis", () => {
  // Use a real function (not vi.fn arrow) so `new Redis(...)` works
  function MockRedis() {
    return mockRedis;
  }
  return { Redis: MockRedis };
});

// Set env vars so the redis client initializes
process.env.UPSTASH_REDIS_REST_URL = "https://fake-redis.upstash.io";
process.env.UPSTASH_REDIS_REST_TOKEN = "fake-token";

// Dynamic import after mocks are set up
const { getCached, setCache, invalidateCache, invalidateCachePattern } =
  await import("@/lib/cache/redis");

describe("getCached", () => {
  beforeEach(() => {
    mockRedis._store.clear();
    vi.clearAllMocks();
  });

  it("returns null on cache miss", async () => {
    mockRedis.get.mockReturnValueOnce(null);
    const result = await getCached("missing-key");
    expect(result).toBeNull();
    expect(mockRedis.get).toHaveBeenCalledWith("missing-key");
  });

  it("returns cached value on cache hit", async () => {
    const cached = { name: "test-data" };
    mockRedis.get.mockReturnValueOnce(cached);
    const result = await getCached("existing-key");
    expect(result).toEqual(cached);
  });
});

describe("setCache", () => {
  beforeEach(() => {
    mockRedis._store.clear();
    vi.clearAllMocks();
  });

  it("calls Redis setex with correct key, TTL, and value", async () => {
    await setCache("my-key", { data: 42 }, 300);
    expect(mockRedis.setex).toHaveBeenCalledWith("my-key", 300, { data: 42 });
  });
});

describe("invalidateCache", () => {
  beforeEach(() => {
    mockRedis._store.clear();
    vi.clearAllMocks();
  });

  it("calls Redis del with the correct key", async () => {
    await invalidateCache("stale-key");
    expect(mockRedis.del).toHaveBeenCalledWith("stale-key");
  });
});

describe("invalidateCachePattern", () => {
  beforeEach(() => {
    mockRedis._store.clear();
    vi.clearAllMocks();
  });

  it("calls Redis scan with the correct pattern", async () => {
    mockRedis.scan.mockResolvedValueOnce([0, []]);
    await invalidateCachePattern("dashboard:*");
    expect(mockRedis.scan).toHaveBeenCalledWith(0, {
      match: "dashboard:*",
      count: 100,
    });
  });

  it("deletes keys returned by scan", async () => {
    mockRedis.scan.mockResolvedValueOnce([0, ["dashboard:1", "dashboard:2"]]);
    await invalidateCachePattern("dashboard:*");
    expect(mockRedis.del).toHaveBeenCalledWith("dashboard:1", "dashboard:2");
  });
});
