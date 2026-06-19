/**
 * Tests for GET /api/providers/nearby.
 *
 * Regression guard (marketplace column-drift): service_provider_details stores
 * location as a PostGIS geography point (base_location), not flat latitude/
 * longitude columns. The route previously filtered `.gte("latitude", …)`, which
 * always errored and degraded the map to an empty list. These tests pin the
 * providers_in_bounds RPC call and the lat/lng mapping.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCreateClient } = vi.hoisted(() => ({ mockCreateClient: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({ createClient: mockCreateClient }));

import { GET } from "./route";

function makeRequest(qs: string) {
  // The route reads request.nextUrl, so a NextRequest-like object is needed.
  const url = new URL(`http://localhost/api/providers/nearby?${qs}`);
  return { nextUrl: url } as never;
}

const VALID = "sw_lat=51.2&sw_lng=-0.6&ne_lat=51.8&ne_lng=0.4";

beforeEach(() => mockCreateClient.mockReset());

describe("GET /api/providers/nearby", () => {
  it("queries the providers_in_bounds RPC with the bbox and maps lat/lng", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          id: "33333333-3333-3333-3333-333333333333",
          slug: "ace-plumbing",
          business_name: "Ace Plumbing",
          category: "plumber",
          average_rating: 4.2,
          lat: 51.5155,
          lng: -0.296,
        },
      ],
      error: null,
    });
    mockCreateClient.mockResolvedValue({ rpc });

    const res = await GET(makeRequest(VALID));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(rpc).toHaveBeenCalledWith("providers_in_bounds", {
      sw_lat: 51.2,
      sw_lng: -0.6,
      ne_lat: 51.8,
      ne_lng: 0.4,
    });
    expect(body.providers[0]).toMatchObject({
      id: "33333333-3333-3333-3333-333333333333",
      name: "Ace Plumbing",
      category: "plumber",
      rating: 4.2,
      lat: 51.5155,
      lng: -0.296,
    });
  });

  it("returns 400 for missing/invalid bounds", async () => {
    const res = await GET(makeRequest("sw_lat=51.2"));
    expect(res.status).toBe(400);
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it("degrades to an empty list (not 500) when the RPC errors", async () => {
    mockCreateClient.mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: "boom" } }),
    });
    const res = await GET(makeRequest(VALID));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.providers).toEqual([]);
  });
});
