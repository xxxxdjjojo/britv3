import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { subscribeToNewsletter } from "@/services/newsletter/newsletter-service";
import { sendNewsletterWelcome } from "@/services/email/email-service";

// ---------------------------------------------------------------------------
// Mocks (service + email + rate limiter) — installed before the route handler
// imports its dependencies.
// ---------------------------------------------------------------------------

vi.mock("@/services/newsletter/newsletter-service", () => ({
  subscribeToNewsletter: vi.fn(),
}));

vi.mock("@/services/email/email-service", () => ({
  sendNewsletterWelcome: vi.fn(async () => {}),
}));

vi.mock("@/lib/cache/redis", () => ({
  createRateLimiter: () => ({
    limit: vi.fn(async () => ({ success: true })),
  }),
}));

// ---------------------------------------------------------------------------
// Import handler after mocks are registered.
// ---------------------------------------------------------------------------

import { POST } from "@/app/api/newsletter/route";

const mockSubscribe = vi.mocked(subscribeToNewsletter);
const mockSendWelcome = vi.mocked(sendNewsletterWelcome);

function postRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/newsletter", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/newsletter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 ok and sends the welcome email for a valid new subscriber", async () => {
    mockSubscribe.mockResolvedValue({ ok: true, alreadySubscribed: false });

    const res = await POST(postRequest({ email: "a@b.com" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.alreadySubscribed).toBe(false);
    expect(mockSendWelcome).toHaveBeenCalledWith({ to: "a@b.com" });
  });

  it("returns 400 and never calls the service for an invalid email", async () => {
    const res = await POST(postRequest({ email: "nope" }));

    expect(res.status).toBe(400);
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it("returns 200 ok with alreadySubscribed and skips the email for a duplicate", async () => {
    mockSubscribe.mockResolvedValue({ ok: true, alreadySubscribed: true });

    const res = await POST(postRequest({ email: "dupe@b.com" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.alreadySubscribed).toBe(true);
    expect(mockSendWelcome).not.toHaveBeenCalled();
  });
});
