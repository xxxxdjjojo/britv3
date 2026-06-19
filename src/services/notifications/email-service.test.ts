import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PlatformEvent } from "@/types/notifications";

const { resendSendMock } = vi.hoisted(() => ({
  resendSendMock: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function Resend() {
    return {
    emails: {
      send: resendSendMock,
    },
    };
  }),
}));

vi.mock("@/lib/cache/redis", () => ({
  createRateLimiter: vi.fn(() => ({
    limit: vi.fn().mockResolvedValue({ success: true }),
  })),
}));

import { sendCriticalEmail, sendDailyDigest } from "@/services/notifications/email-service";

function event(overrides: Partial<PlatformEvent> = {}): PlatformEvent {
  return {
    id: 1,
    event_type: "quote_received",
    entity_type: "rfq",
    entity_id: "rfq-1",
    actor_id: "actor-1",
    metadata: {},
    created_at: new Date("2026-06-19T09:00:00Z"),
    actor_name: "Priya Provider",
    ...overrides,
  };
}

describe("notification email branding", () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = "test-resend-key";
    delete process.env.NEXT_PUBLIC_APP_URL;
    resendSendMock.mockReset();
    resendSendMock.mockResolvedValue({ id: "email-1" });
  });

  it("uses TrueDeed sender, header and fallback CTA URL for critical notifications", async () => {
    await sendCriticalEmail("recipient@example.com", "Quote received - TrueDeed", event());

    const payload = resendSendMock.mock.calls[0][0] as { from: string; subject: string; html: string };
    expect(payload.from).toBe("TrueDeed <hello@truedeed.co.uk>");
    expect(payload.html).toContain("TrueDeed");
    expect(payload.html).toContain("https://truedeed.co.uk/quotes/rfq-1");
    expect(`${payload.from} ${payload.subject} ${payload.html}`).not.toMatch(/Britestate|britestate\./);
  });

  it("uses TrueDeed sender, subject, body and fallback dashboard URL for daily digests", async () => {
    await sendDailyDigest("recipient@example.com", "Riley", [event()]);

    const payload = resendSendMock.mock.calls[0][0] as { from: string; subject: string; html: string };
    expect(payload.from).toBe("TrueDeed <hello@truedeed.co.uk>");
    expect(payload.subject).toBe("Your daily digest - 1 update on TrueDeed");
    expect(payload.html).toContain("View all on TrueDeed");
    expect(payload.html).toContain("https://truedeed.co.uk/notifications");
    expect(`${payload.from} ${payload.subject} ${payload.html}`).not.toMatch(/Britestate|britestate\./);
  });
});
