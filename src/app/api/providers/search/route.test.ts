import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

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
});
