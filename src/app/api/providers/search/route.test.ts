import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// NOTE: The Redis client is a module-level singleton. Tests cannot independently
// test the HIT path without vi.resetModules() + dynamic re-import per test,
// because clearAllMocks() does not reset the cached Redis instance.

// Mock modules before importing the route
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({}),
}));

vi.mock("@upstash/redis", () => ({
  Redis: vi.fn().mockImplementation(() => ({
    get: vi.fn().mockResolvedValue(null),
    setex: vi.fn().mockResolvedValue("OK"),
  })),
}));

vi.mock("@/services/marketplace/provider-service", () => ({
  searchProviders: vi.fn().mockResolvedValue({ data: [], count: 0 }),
}));

// Import after mocks are set up
const { GET } = await import("./route");

describe("GET /api/providers/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up module registry changes made by the HIT-path test
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    vi.resetModules();
  });

  it("returns 200 with valid search params", async () => {
    const req = new NextRequest(
      "http://localhost/api/providers/search?postcode=SW1A+1AA"
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it("returns 400 for invalid search params (radius out of range)", async () => {
    const req = new NextRequest(
      "http://localhost/api/providers/search?postcode=SW1A+1AA&radius=999"
    );
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("adds Cache-Control header on response", async () => {
    const req = new NextRequest(
      "http://localhost/api/providers/search?postcode=SW1A+1AA"
    );
    const res = await GET(req);
    expect(res.headers.get("Cache-Control")).toContain("max-age=300");
  });

  it("returns cached result with X-Cache: HIT when Redis has a cached value", async () => {
    vi.resetModules();

    // Provide env vars so getRedis() proceeds past the early-return guard
    process.env.UPSTASH_REDIS_REST_URL = "https://fake.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "fake-token";

    vi.doMock("@/lib/supabase/server", () => ({
      createClient: vi.fn().mockResolvedValue({}),
    }));

    const cachedResult = { data: [{ user_id: "prov-cached" }], count: 1 };

    vi.doMock("@upstash/redis", () => {
      const instance = {
        get: vi.fn().mockResolvedValue(cachedResult),
        setex: vi.fn().mockResolvedValue("OK"),
      };
      function RedisMock() {
        return instance;
      }
      return { Redis: RedisMock };
    });

    vi.doMock("@/services/marketplace/provider-service", () => ({
      searchProviders: vi.fn().mockResolvedValue({ data: [], count: 0 }),
    }));

    const { GET: FreshGET } = await import("./route");
    const { searchProviders } = await import("@/services/marketplace/provider-service");

    const req = new NextRequest(
      "http://localhost/api/providers/search?postcode=SW1A+1AA"
    );
    const res = await FreshGET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Cache")).toBe("HIT");
    expect(searchProviders).not.toHaveBeenCalled();

    // Clean up env vars added for this test
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });
});
