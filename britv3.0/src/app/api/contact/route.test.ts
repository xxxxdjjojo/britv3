/**
 * Tests for POST /api/contact route.
 * Covers validation, rate limiting, and email dispatch.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks (must be declared before imports that use the mocked modules)
// ---------------------------------------------------------------------------

const mockEmailSend = vi.fn();
const mockRateLimitFn = vi.fn();

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockEmailSend },
  })),
}));

vi.mock("@/lib/cache/redis", () => ({
  createRateLimiter: vi.fn().mockImplementation(() => ({
    limit: mockRateLimitFn,
  })),
}));

// ---------------------------------------------------------------------------
// Import after mocks are in place
// ---------------------------------------------------------------------------

import { POST } from "./route";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: unknown, ip = "1.2.3.4"): Request {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

const validBody = {
  name: "Alice Smith",
  email: "alice@example.com",
  subject: "Question about Britestate",
  message: "I have a question about how to list my property on the platform.",
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/contact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: rate limit allows requests
    mockRateLimitFn.mockResolvedValue({ success: true });
    // Default: email sends successfully
    mockEmailSend.mockResolvedValue({ id: "email-id-123" });
    // Set required env var
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.SUPPORT_EMAIL = "support@britestate.com";
  });

  describe("valid submission", () => {
    it("returns 200 with success: true for valid body", async () => {
      const req = makeRequest(validBody);
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json).toEqual({ success: true });
    });

    it("calls email send with correct parameters", async () => {
      const req = makeRequest(validBody);
      await POST(req);

      expect(mockEmailSend).toHaveBeenCalledOnce();
      const callArgs = mockEmailSend.mock.calls[0][0];
      expect(callArgs.to).toBe("support@britestate.com");
      expect(callArgs.subject).toContain(validBody.subject);
    });
  });

  describe("validation errors", () => {
    it("returns 400 when name is missing", async () => {
      const { name: _name, ...noName } = validBody;
      const res = await POST(makeRequest(noName));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBeDefined();
    });

    it("returns 400 when email is invalid", async () => {
      const res = await POST(makeRequest({ ...validBody, email: "not-an-email" }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBeDefined();
    });

    it("returns 400 when message is too short (under 20 chars)", async () => {
      const res = await POST(makeRequest({ ...validBody, message: "Too short" }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBeDefined();
    });

    it("returns 400 when subject is too short (under 5 chars)", async () => {
      const res = await POST(makeRequest({ ...validBody, subject: "Hi" }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBeDefined();
    });

    it("returns 400 when name is too short (under 2 chars)", async () => {
      const res = await POST(makeRequest({ ...validBody, name: "A" }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBeDefined();
    });

    it("returns 400 when message exceeds 2000 chars", async () => {
      const res = await POST(makeRequest({ ...validBody, message: "a".repeat(2001) }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBeDefined();
    });
  });

  describe("rate limiting", () => {
    it("returns 429 when rate limit is exceeded", async () => {
      mockRateLimitFn.mockResolvedValue({ success: false });

      const res = await POST(makeRequest(validBody));
      expect(res.status).toBe(429);
      const json = await res.json();
      expect(json.error).toBe("Too many requests");
    });

    it("does not send email when rate limited", async () => {
      mockRateLimitFn.mockResolvedValue({ success: false });
      await POST(makeRequest(validBody));
      expect(mockEmailSend).not.toHaveBeenCalled();
    });
  });

  describe("graceful degradation", () => {
    it("returns 200 even when RESEND_API_KEY is missing", async () => {
      delete process.env.RESEND_API_KEY;
      const res = await POST(makeRequest(validBody));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });
});
