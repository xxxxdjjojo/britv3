import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  getUser: vi.fn(),
  rolesEq: vi.fn(),
  attributeReferralAfterAuthentication: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { exchangeCodeForSession: mocks.exchangeCodeForSession, getUser: mocks.getUser },
    from: vi.fn(() => ({ select: vi.fn(() => ({ eq: mocks.rolesEq })) })),
  })),
}));
vi.mock("@/services/referrals/vouch-referral-service", () => ({
  attributeReferralAfterAuthentication: mocks.attributeReferralAfterAuthentication,
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
    mocks.attributeReferralAfterAuthentication.mockResolvedValue({ attributed: true, outcome: "attributed" });
  });

  it("attributes ref and invite cookies only after the session is established", async () => {
    const request = new NextRequest(
      "https://truedeed.test/auth/callback?code=oauth-code&next=%2Fvouch%2Ftoken-1%3Fconsent%3D1",
    );
    request.cookies.set("britestate_ref", "ABC12345");
    request.cookies.set("truedeed_invite", "11111111-1111-4111-8111-111111111111");

    const response = await GET(request);

    expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith("oauth-code");
    expect(mocks.attributeReferralAfterAuthentication).toHaveBeenCalledWith({
      userId: "member-2",
      referralCode: "ABC12345",
      inviteToken: "11111111-1111-4111-8111-111111111111",
    });
    expect(response.headers.get("location")).toBe(
      "https://truedeed.test/vouch/token-1?consent=1",
    );
  });
});
