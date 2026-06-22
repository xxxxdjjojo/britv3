import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Controllable auth state for the mocked Supabase server client.
let mockUser: { id: string } | null = { id: "user-1" };

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({ data: { user: mockUser } })),
    },
  })),
}));

async function callRoute(query: string) {
  const { GET } = await import("@/app/api/seller/valuation/route");
  const request = new Request(`http://localhost:3000/api/seller/valuation${query}`);
  return GET(request);
}

describe("GET /api/seller/valuation — postcode guard", () => {
  beforeEach(() => {
    mockUser = { id: "user-1" };
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 401 when unauthenticated", async () => {
    mockUser = null;
    const res = await callRoute("?postcode=SW1A%201AA");
    expect(res.status).toBe(401);
  });

  it("returns 400 when postcode is missing", async () => {
    const res = await callRoute("");
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "postcode required" });
  });

  it.each([
    "SW1A 1AA&max_rows=9999", // query-param injection into upstream URL
    "../../etc/passwd", // path traversal characters
    "SW1;DROP", // injection punctuation
    "SW1A#1AA", // illegal symbol
    "ABCDEFGHIJ", // 10 chars — exceeds 8-char cap
  ])("returns 400 'invalid postcode' for malformed input %j", async (raw) => {
    const res = await callRoute(`?postcode=${encodeURIComponent(raw)}`);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid postcode" });
  });

  it("accepts a valid postcode and never injects extra query params upstream", async () => {
    const fetchSpy = vi.fn(async () => new Response("", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);

    const res = await callRoute("?postcode=SW1A%201AA");

    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledOnce();
    const calledUrl = String(fetchSpy.mock.calls[0]?.[0]);
    // The space is encoded as "+", and no caller-controlled "&"/"=" leaks in.
    expect(calledUrl).toContain("postcode=SW1A+1AA");
    expect(calledUrl).toBe(
      "https://landregistry.data.gov.uk/app/ppd/ppd_data.csv?postcode=SW1A+1AA&max_rows=10&format=csv",
    );
  });
});
