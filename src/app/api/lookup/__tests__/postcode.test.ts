import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../postcode/route";
import { NextRequest } from "next/server";

const mockFetch = vi.fn();
global.fetch = mockFetch;

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost:3000/api/lookup/postcode", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/lookup/postcode", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("returns district data for valid postcode", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          status: 200,
          result: {
            outcode: "SW1A",
            admin_district: ["Westminster"],
            latitude: 51.501009,
            longitude: -0.141588,
            country: ["England"],
          },
        }),
    });

    const res = await POST(makeRequest({ postcode: "SW1A" }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.district).toBe("SW1A");
    expect(data.area).toBe("Westminster");
    expect(data.latitude).toBeDefined();
  });

  it("returns 400 for empty postcode", async () => {
    const res = await POST(makeRequest({ postcode: "" }));
    expect(res.status).toBe(400);
  });

  it("returns 404 for unknown postcode", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const res = await POST(makeRequest({ postcode: "ZZ99" }));
    expect(res.status).toBe(404);
  });
});
