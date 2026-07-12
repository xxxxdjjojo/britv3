import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCreateAdminClient, mockDeclineReference, mockLimit } = vi.hoisted(() => ({
  mockCreateAdminClient: vi.fn(() => ({})),
  mockDeclineReference: vi.fn(),
  mockLimit: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mockCreateAdminClient }));
vi.mock("@/lib/cache/redis", () => ({
  createRateLimiter: () => ({ limit: mockLimit }),
}));
vi.mock("@/services/provider/reference-submission-service", () => ({
  declineReference: mockDeclineReference,
}));

import type { NextRequest } from "next/server";

import { POST } from "./route";

const TOKEN = "raw-token-abc123";
const params = Promise.resolve({ token: TOKEN });

function makeRequest(body?: unknown): NextRequest {
  return new Request(`http://localhost/api/references/${TOKEN}/decline`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.9" },
    body: body === undefined ? "" : JSON.stringify(body),
  }) as NextRequest;
}

beforeEach(() => {
  mockLimit.mockReset();
  mockDeclineReference.mockReset();
  mockLimit.mockResolvedValue({ success: true });
});

describe("POST /api/references/[token]/decline", () => {
  it("returns 200 and forwards the token + optional reason (no ids in call)", async () => {
    mockDeclineReference.mockResolvedValue({ success: true });
    const res = await POST(makeRequest({ reason: "Too busy" }), { params });
    expect(res.status).toBe(200);
    expect(mockDeclineReference).toHaveBeenCalledWith(expect.anything(), TOKEN, "Too busy");
  });

  it("accepts an empty body (reason is optional)", async () => {
    mockDeclineReference.mockResolvedValue({ success: true });
    const res = await POST(makeRequest(), { params });
    expect(res.status).toBe(200);
    expect(mockDeclineReference).toHaveBeenCalledWith(expect.anything(), TOKEN, undefined);
  });

  it("maps state 'used' to 409", async () => {
    mockDeclineReference.mockResolvedValue({ success: false, state: "used", error: "already" });
    const res = await POST(makeRequest({}), { params });
    expect(res.status).toBe(409);
  });

  it("maps state 'expired' to 410", async () => {
    mockDeclineReference.mockResolvedValue({ success: false, state: "expired", error: "gone" });
    const res = await POST(makeRequest({}), { params });
    expect(res.status).toBe(410);
  });

  it("maps state 'invalid' to 404", async () => {
    mockDeclineReference.mockResolvedValue({ success: false, state: "invalid", error: "x" });
    const res = await POST(makeRequest({}), { params });
    expect(res.status).toBe(404);
  });

  it("returns 429 when rate limited without calling the service", async () => {
    mockLimit.mockResolvedValue({ success: false });
    const res = await POST(makeRequest({}), { params });
    expect(res.status).toBe(429);
    expect(mockDeclineReference).not.toHaveBeenCalled();
  });

  it("keys the rate limiter on the client IP", async () => {
    mockDeclineReference.mockResolvedValue({ success: true });
    await POST(makeRequest({}), { params });
    expect(mockLimit).toHaveBeenCalledWith("ref_decline:203.0.113.9");
  });
});
