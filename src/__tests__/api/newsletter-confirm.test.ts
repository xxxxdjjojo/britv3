import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { confirmNewsletterSubscription } from "@/services/newsletter/newsletter-service";
import { sendBriefingWelcome, sendLandlordDiaryWelcome } from "@/services/email/email-service";
import {
  generateNewsletterToken,
  verifyNewsletterToken,
} from "@/lib/newsletter-token";

// ---------------------------------------------------------------------------
// Mocks — installed before the route handler imports its dependencies.
// ---------------------------------------------------------------------------

vi.mock("@/services/newsletter/newsletter-service", () => ({
  confirmNewsletterSubscription: vi.fn(),
  DOUBLE_OPT_IN_AUDIENCES: ["agent_briefing", "landlord_diary"],
}));

vi.mock("@/services/email/email-service", () => ({
  sendBriefingWelcome: vi.fn(async () => {}),
  sendLandlordDiaryWelcome: vi.fn(async () => {}),
}));

vi.mock("@/lib/newsletter-token", () => ({
  verifyNewsletterToken: vi.fn(),
  generateNewsletterToken: vi.fn(() => "unsubscribe-token"),
}));

// ---------------------------------------------------------------------------
// Import handler after mocks are registered.
// ---------------------------------------------------------------------------

import { GET } from "@/app/api/newsletter/confirm/route";

const mockConfirm = vi.mocked(confirmNewsletterSubscription);
const mockVerify = vi.mocked(verifyNewsletterToken);
const mockGenerate = vi.mocked(generateNewsletterToken);
const mockSendWelcome = vi.mocked(sendBriefingWelcome);

function getRequest(token?: string): NextRequest {
  const qs = token === undefined ? "" : `?token=${token}`;
  return new NextRequest(`http://localhost/api/newsletter/confirm${qs}`);
}

describe("GET /api/newsletter/confirm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("confirms, sends the briefing welcome, and redirects to /agent-briefing", async () => {
    mockVerify.mockReturnValue({
      ok: true,
      email: "agent@b.com",
      audience: "agent_briefing",
    });
    mockConfirm.mockResolvedValue({ ok: true, alreadyConfirmed: false });

    const res = await GET(getRequest("good-token"));

    expect(mockVerify).toHaveBeenCalledWith("good-token", "confirm");
    expect(mockConfirm).toHaveBeenCalledWith("agent@b.com", "agent_briefing");
    expect(mockGenerate).toHaveBeenCalledWith("agent@b.com", "agent_briefing", "unsubscribe");
    expect(mockSendWelcome).toHaveBeenCalledWith({
      to: "agent@b.com",
      unsubscribeUrl: expect.stringContaining(
        "/api/newsletter/unsubscribe?token=unsubscribe-token",
      ),
    });
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "http://localhost/agent-briefing?subscribed=1",
    );
  });

  it("redirects landlord_diary confirmations to the deadline diary page", async () => {
    mockVerify.mockReturnValue({
      ok: true,
      email: "landlord@b.com",
      audience: "landlord_diary",
    });
    mockConfirm.mockResolvedValue({ ok: true, alreadyConfirmed: false });

    const res = await GET(getRequest("good-token"));

    expect(res.headers.get("location")).toBe(
      "http://localhost/landlords/deadline-diary?subscribed=1",
    );
  });

  it("redirects other audiences to the homepage", async () => {
    mockVerify.mockReturnValue({
      ok: true,
      email: "buyer@b.com",
      audience: "ftb_bootcamp",
    });
    mockConfirm.mockResolvedValue({ ok: true, alreadyConfirmed: false });

    const res = await GET(getRequest("good-token"));

    expect(res.headers.get("location")).toBe("http://localhost/?subscribed=1");
    // ftb_bootcamp is not a briefing audience — no briefing welcome.
    expect(mockSendWelcome).not.toHaveBeenCalled();
  });

  it("does not re-send the welcome when the row was already confirmed", async () => {
    mockVerify.mockReturnValue({
      ok: true,
      email: "agent@b.com",
      audience: "agent_briefing",
    });
    mockConfirm.mockResolvedValue({ ok: true, alreadyConfirmed: true });

    const res = await GET(getRequest("good-token"));

    expect(mockSendWelcome).not.toHaveBeenCalled();
    expect(res.headers.get("location")).toBe(
      "http://localhost/agent-briefing?subscribed=1",
    );
  });

  it("redirects to the error page for an invalid or expired token", async () => {
    mockVerify.mockReturnValue({ ok: false, reason: "expired" });

    const res = await GET(getRequest("stale-token"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "http://localhost/agent-briefing?subscribe_error=expired",
    );
    expect(mockConfirm).not.toHaveBeenCalled();
    expect(mockSendWelcome).not.toHaveBeenCalled();
  });

  it("redirects to the error page when the token is missing", async () => {
    const res = await GET(getRequest());

    expect(res.headers.get("location")).toBe(
      "http://localhost/agent-briefing?subscribe_error=expired",
    );
    expect(mockVerify).not.toHaveBeenCalled();
  });

  it("redirects to the error page when the service cannot confirm", async () => {
    mockVerify.mockReturnValue({
      ok: true,
      email: "ghost@b.com",
      audience: "agent_briefing",
    });
    mockConfirm.mockResolvedValue({ ok: false, error: "not_found" });

    const res = await GET(getRequest("good-token"));

    expect(res.headers.get("location")).toBe(
      "http://localhost/agent-briefing?subscribe_error=expired",
    );
    expect(mockSendWelcome).not.toHaveBeenCalled();
  });
});
