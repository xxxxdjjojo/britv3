import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { unsubscribeFromNewsletter } from "@/services/newsletter/newsletter-service";
import { verifyNewsletterToken } from "@/lib/newsletter-token";

// ---------------------------------------------------------------------------
// Mocks — installed before the route handler imports its dependencies.
// ---------------------------------------------------------------------------

vi.mock("@/services/newsletter/newsletter-service", () => ({
  unsubscribeFromNewsletter: vi.fn(),
}));

vi.mock("@/lib/newsletter-token", () => ({
  verifyNewsletterToken: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Import handler after mocks are registered.
// ---------------------------------------------------------------------------

import { GET } from "@/app/api/newsletter/unsubscribe/route";

const mockUnsubscribe = vi.mocked(unsubscribeFromNewsletter);
const mockVerify = vi.mocked(verifyNewsletterToken);

function getRequest(token?: string): NextRequest {
  const qs = token === undefined ? "" : `?token=${token}`;
  return new NextRequest(`http://localhost/api/newsletter/unsubscribe${qs}`);
}

describe("GET /api/newsletter/unsubscribe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("unsubscribes the (email, audience) from the token and redirects", async () => {
    mockVerify.mockReturnValue({
      ok: true,
      email: "agent@b.com",
      audience: "agent_briefing",
    });
    mockUnsubscribe.mockResolvedValue({ ok: true, alreadyUnsubscribed: false });

    const res = await GET(getRequest("good-token"));

    expect(mockVerify).toHaveBeenCalledWith("good-token", "unsubscribe");
    expect(mockUnsubscribe).toHaveBeenCalledWith("agent@b.com", "agent_briefing");
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/?unsubscribed=1");
  });

  it("is idempotent — an already-unsubscribed token still confirms", async () => {
    mockVerify.mockReturnValue({
      ok: true,
      email: "agent@b.com",
      audience: "agent_briefing",
    });
    mockUnsubscribe.mockResolvedValue({ ok: true, alreadyUnsubscribed: true });

    const res = await GET(getRequest("good-token"));

    expect(res.headers.get("location")).toBe("http://localhost/?unsubscribed=1");
  });

  it("rejects an invalid token without touching the service", async () => {
    mockVerify.mockReturnValue({ ok: false, reason: "invalid_signature" });

    const res = await GET(getRequest("bad-token"));

    expect(res.headers.get("location")).toBe(
      "http://localhost/?unsubscribe_error=invalid",
    );
    expect(mockUnsubscribe).not.toHaveBeenCalled();
  });

  it("rejects a missing token", async () => {
    const res = await GET(getRequest());

    expect(res.headers.get("location")).toBe(
      "http://localhost/?unsubscribe_error=invalid",
    );
    expect(mockVerify).not.toHaveBeenCalled();
  });

  it("surfaces a service failure as the error redirect", async () => {
    mockVerify.mockReturnValue({
      ok: true,
      email: "agent@b.com",
      audience: "agent_briefing",
    });
    mockUnsubscribe.mockResolvedValue({ ok: false, error: "internal_error" });

    const res = await GET(getRequest("good-token"));

    expect(res.headers.get("location")).toBe(
      "http://localhost/?unsubscribe_error=invalid",
    );
  });
});
