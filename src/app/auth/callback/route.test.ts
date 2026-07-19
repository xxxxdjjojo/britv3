import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  getUser: vi.fn(),
  rolesEq: vi.fn(),
  adminRpc: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { exchangeCodeForSession: mocks.exchangeCodeForSession, getUser: mocks.getUser },
    from: vi.fn(() => ({ select: vi.fn(() => ({ eq: mocks.rolesEq })) })),
  })),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc: mocks.adminRpc }),
}));
vi.mock("@/services/email/email-service", () => ({ sendWelcome: vi.fn() }));
vi.mock("@/inngest/client", () => ({ inngest: { send: vi.fn() } }));

import { GET } from "./route";

describe("OAuth callback referral attribution", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.exchangeCodeForSession.mockResolvedValue({ error: null });
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "member-2", email: "member@example.test", user_metadata: {} } },
    });
    mocks.rolesEq.mockResolvedValue({ data: [{ role: "service_provider" }] });
    mocks.adminRpc.mockResolvedValue({ data: [{ outcome: "attributed" }], error: null });
  });

  it("attributes ref and invite cookies only after the session is established", async () => {
    const request = new NextRequest(
      "https://truedeed.test/auth/callback?code=oauth-code&next=%2Fvouch%2Ftoken-1%3Fconsent%3D1",
    );
    request.cookies.set("britestate_ref", "ABC12345");
    request.cookies.set("truedeed_invite", "11111111-1111-4111-8111-111111111111");

    const response = await GET(request);

    expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith("oauth-code");
    expect(mocks.adminRpc).toHaveBeenCalledWith("attribute_referral_signup", {
      p_referred_profile_id: "member-2",
      p_referral_code: "ABC12345",
      p_invite_token: "11111111-1111-4111-8111-111111111111",
    });
    expect(response.headers.get("location")).toBe(
      "https://truedeed.test/vouch/token-1?consent=1",
    );
    const setCookie = response.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("britestate_ref=");
    expect(setCookie).toContain("truedeed_invite=");
  });
});
