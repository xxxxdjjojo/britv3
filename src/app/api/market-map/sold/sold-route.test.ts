import type { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { GET } from "./[z]/[x]/[y]/route";

// These three cases all short-circuit before any Supabase call (invalid coords,
// out-of-range zoom, and the z<14 high-zoom guard), so no DB mocking is needed.
// happy path covered by e2e

const req = { nextUrl: { searchParams: new URLSearchParams() } } as unknown as NextRequest;

function callGet(z: string, x: string, y: string): Promise<Response> {
  return GET(req, { params: Promise.resolve({ z, x, y }) });
}

describe("GET /api/market-map/sold/[z]/[x]/[y]", () => {
  it("returns 204 for zoom below the sold-layer minimum without touching the DB", async () => {
    const res = await callGet("13", "0", "0");
    expect(res.status).toBe(204);
  });

  it("returns 400 for invalid tile coordinates", async () => {
    const res = await callGet("abc", "0", "0");
    expect(res.status).toBe(400);
  });

  it("returns 400 when the zoom is out of range", async () => {
    const res = await callGet("23", "0", "0");
    expect(res.status).toBe(400);
  });
});
