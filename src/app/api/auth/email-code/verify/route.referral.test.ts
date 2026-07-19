import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verifyOtp: vi.fn(),
  adminRpc: vi.fn(),
  cookieGet: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth: { verifyOtp: mocks.verifyOtp } })),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    rpc: mocks.adminRpc,
    from: vi.fn(() => ({
      upsert: vi.fn().mockResolvedValue({ error: null }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
  }),
}));
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: mocks.cookieGet })),
}));
vi.mock("@/lib/cache/redis", () => ({
  createAuthRateLimiter: () => ({ limit: vi.fn().mockResolvedValue({ success: true }) }),
}));
vi.mock("@/services/valuation/session-repo", () => ({ claimSessionToUser: vi.fn() }));
vi.mock("@/lib/analytics/posthog-server", () => ({ posthogServer: { capture: vi.fn() } }));

import { POST } from "./route";

describe("email OTP referral attribution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verifyOtp.mockResolvedValue({
      data: { user: { id: "member-otp", email: "member@example.test" } },
      error: null,
    });
    mocks.adminRpc.mockResolvedValue({
      data: [{ outcome: "attributed", referral_id: "referral-1" }],
      error: null,
    });
    mocks.cookieGet.mockImplementation((name: string) => ({
      value: name === "britestate_ref"
        ? "ABC12345"
        : name === "truedeed_invite"
          ? "11111111-1111-4111-8111-111111111111"
          : undefined,
    }));
  });

  it("attributes with the real server service after OTP creates a session, then clears cookies", async () => {
    const response = await POST(new Request("https://truedeed.test/api/auth/email-code/verify", {
      method: "POST",
      body: JSON.stringify({ email: "member@example.test", token: "123456" }),
    }));

    expect(mocks.verifyOtp).toHaveBeenCalled();
    expect(mocks.adminRpc).toHaveBeenCalledWith("attribute_referral_signup", {
      p_referred_profile_id: "member-otp",
      p_referral_code: "ABC12345",
      p_invite_token: "11111111-1111-4111-8111-111111111111",
    });
    const setCookie = response.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("britestate_ref=");
    expect(setCookie).toContain("truedeed_invite=");
  });
});
