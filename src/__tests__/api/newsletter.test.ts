import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { subscribeToNewsletter } from "@/services/newsletter/newsletter-service";
import {
  sendBriefingConfirm,
  sendNewsletterWelcome,
} from "@/services/email/email-service";
import { generateNewsletterToken } from "@/lib/newsletter-token";

// ---------------------------------------------------------------------------
// Mocks (service + email + token + rate limiter) — installed before the route
// handler imports its dependencies.
// ---------------------------------------------------------------------------

vi.mock("@/services/newsletter/newsletter-service", () => ({
  subscribeToNewsletter: vi.fn(),
}));

vi.mock("@/services/email/email-service", () => ({
  sendNewsletterWelcome: vi.fn(async () => {}),
  sendBriefingConfirm: vi.fn(async () => {}),
}));

vi.mock("@/lib/newsletter-token", () => ({
  generateNewsletterToken: vi.fn(() => "signed-token"),
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
const mockSendConfirm = vi.mocked(sendBriefingConfirm);
const mockGenerateToken = vi.mocked(generateNewsletterToken);

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
    mockSubscribe.mockResolvedValue({
      ok: true,
      alreadySubscribed: false,
      requiresConfirmation: false,
    });

    const res = await POST(postRequest({ email: "a@b.com" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.alreadySubscribed).toBe(false);
    expect(mockSubscribe).toHaveBeenCalledWith({
      email: "a@b.com",
      source: "blog",
      audience: "consumer",
    });
    expect(mockSendWelcome).toHaveBeenCalledWith({ to: "a@b.com" });
    expect(mockSendConfirm).not.toHaveBeenCalled();
  });

  it("returns 400 and never calls the service for an invalid email", async () => {
    const res = await POST(postRequest({ email: "nope" }));

    expect(res.status).toBe(400);
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it("returns 400 for an unknown audience", async () => {
    const res = await POST(postRequest({ email: "a@b.com", audience: "vip_club" }));

    expect(res.status).toBe(400);
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it("returns 200 ok with alreadySubscribed and skips the email for a duplicate", async () => {
    mockSubscribe.mockResolvedValue({
      ok: true,
      alreadySubscribed: true,
      requiresConfirmation: false,
    });

    const res = await POST(postRequest({ email: "dupe@b.com" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.alreadySubscribed).toBe(true);
    expect(mockSendWelcome).not.toHaveBeenCalled();
  });

  it("sends a confirmation email (not welcome) for a double-opt-in audience", async () => {
    mockSubscribe.mockResolvedValue({
      ok: true,
      alreadySubscribed: false,
      requiresConfirmation: true,
    });

    const res = await POST(
      postRequest({ email: "Agent@B.com", audience: "agent_briefing" }),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ ok: true, requiresConfirmation: true });
    expect(mockSubscribe).toHaveBeenCalledWith({
      email: "Agent@B.com",
      source: "blog",
      audience: "agent_briefing",
    });
    // Token is bound to the normalised email + audience with purpose confirm.
    expect(mockGenerateToken).toHaveBeenCalledWith(
      "agent@b.com",
      "agent_briefing",
      "confirm",
    );
    expect(mockSendConfirm).toHaveBeenCalledWith({
      to: "Agent@B.com",
      confirmUrl: expect.stringContaining("/api/newsletter/confirm?token=signed-token"),
    });
    expect(mockSendWelcome).not.toHaveBeenCalled();
  });

  it("re-sends the confirmation when a pending subscriber subscribes again", async () => {
    mockSubscribe.mockResolvedValue({
      ok: true,
      alreadySubscribed: true,
      requiresConfirmation: true,
    });

    const res = await POST(
      postRequest({ email: "agent@b.com", audience: "landlord_diary" }),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ ok: true, requiresConfirmation: true });
    expect(mockSendConfirm).toHaveBeenCalled();
    expect(mockSendWelcome).not.toHaveBeenCalled();
  });
});
