import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCreateAdminClient, mockSubmitReference, mockLimit } = vi.hoisted(() => ({
  mockCreateAdminClient: vi.fn(() => ({})),
  mockSubmitReference: vi.fn(),
  mockLimit: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mockCreateAdminClient }));
vi.mock("@/lib/cache/redis", () => ({
  createRateLimiter: () => ({ limit: mockLimit }),
}));
vi.mock("@/services/provider/reference-submission-service", () => ({
  submitReference: mockSubmitReference,
}));

import type { NextRequest } from "next/server";

import { POST } from "./route";

const TOKEN = "raw-token-abc123";
const params = Promise.resolve({ token: TOKEN });

function makeRequest(body: unknown): NextRequest {
  return new Request(`http://localhost/api/references/${TOKEN}/submit`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.5" },
    body: JSON.stringify(body),
  }) as NextRequest;
}

const validBody = {
  reference_text: "They did a great job on our bathroom.",
  relationship: "Customer",
  work_date: "2026-01-10",
  rating: 5,
};

beforeEach(() => {
  mockLimit.mockReset();
  mockSubmitReference.mockReset();
  mockLimit.mockResolvedValue({ success: true });
});

describe("POST /api/references/[token]/submit", () => {
  it("returns 200 on success and forwards the token + a body with no ids", async () => {
    mockSubmitReference.mockResolvedValue({ success: true });
    const res = await POST(makeRequest(validBody), { params });
    expect(res.status).toBe(200);

    const [, forwardedToken, forwardedBody] = mockSubmitReference.mock.calls[0];
    expect(forwardedToken).toBe(TOKEN);
    // No id/provider fields leak into the service call.
    expect(forwardedBody).not.toHaveProperty("id");
    expect(forwardedBody).not.toHaveProperty("provider_id");
    expect(forwardedBody).not.toHaveProperty("reference_id");
    expect(forwardedBody.reference_text).toBe(validBody.reference_text);
    expect(forwardedBody.rating).toBe(5);
  });

  it("strips unexpected id fields from the body before calling the service", async () => {
    mockSubmitReference.mockResolvedValue({ success: true });
    const res = await POST(
      makeRequest({ ...validBody, id: "sneaky", provider_id: "evil" }),
      { params },
    );
    expect(res.status).toBe(200);
    const [, , forwardedBody] = mockSubmitReference.mock.calls[0];
    expect(forwardedBody).not.toHaveProperty("id");
    expect(forwardedBody).not.toHaveProperty("provider_id");
  });

  it("maps state 'used' to 409", async () => {
    mockSubmitReference.mockResolvedValue({ success: false, state: "used", error: "already" });
    const res = await POST(makeRequest(validBody), { params });
    expect(res.status).toBe(409);
  });

  it("maps state 'expired' to 410", async () => {
    mockSubmitReference.mockResolvedValue({ success: false, state: "expired", error: "gone" });
    const res = await POST(makeRequest(validBody), { params });
    expect(res.status).toBe(410);
  });

  it("maps state 'invalid' to 404 with a generic message", async () => {
    mockSubmitReference.mockResolvedValue({ success: false, state: "invalid", error: "x" });
    const res = await POST(makeRequest(validBody), { params });
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("This link is not valid.");
  });

  it("returns 400 for a body that fails schema validation without calling the service", async () => {
    const res = await POST(makeRequest({ reference_text: "short" }), { params });
    expect(res.status).toBe(400);
    expect(mockSubmitReference).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limited without calling the service", async () => {
    mockLimit.mockResolvedValue({ success: false });
    const res = await POST(makeRequest(validBody), { params });
    expect(res.status).toBe(429);
    expect(mockSubmitReference).not.toHaveBeenCalled();
  });

  it("keys the rate limiter on the client IP", async () => {
    mockSubmitReference.mockResolvedValue({ success: true });
    await POST(makeRequest(validBody), { params });
    expect(mockLimit).toHaveBeenCalledWith("ref_submit:203.0.113.5");
  });
});
