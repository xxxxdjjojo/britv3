import { beforeEach, describe, expect, it, vi } from "vitest";

const getUserMock = vi.fn();
const profileMaybeSingle = vi.fn();
const userClient = {
  auth: { getUser: getUserMock },
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ maybeSingle: profileMaybeSingle }),
    }),
  }),
};
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => userClient,
}));

const adminUpdateEq = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({ eq: adminUpdateEq }),
    }),
  }),
}));

const createSessionMock = vi.fn();
vi.mock("@/services/verification/adapters/kyc-stub-adapter", () => ({
  getKycProvider: () => ({ name: "mock", createSession: createSessionMock }),
}));

import { POST } from "./route";

function makeRequest() {
  return new Request("http://localhost/api/kyc/session", { method: "POST" });
}

describe("POST /api/kyc/session", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    profileMaybeSingle.mockReset();
    createSessionMock.mockReset();
    adminUpdateEq.mockReset();
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1", email: "t@example.com" } } });
    profileMaybeSingle.mockResolvedValue({ data: { kyc_status: "not_started" }, error: null });
    adminUpdateEq.mockResolvedValue({ error: null });
  });

  it("401s when unauthenticated", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
  });

  it("409s when already verified", async () => {
    profileMaybeSingle.mockResolvedValue({ data: { kyc_status: "verified" }, error: null });
    const res = await POST(makeRequest());
    expect(res.status).toBe(409);
    expect(createSessionMock).not.toHaveBeenCalled();
  });

  it("409s when the provider has no hosted flow (stub)", async () => {
    createSessionMock.mockResolvedValue({ providerRef: "stub_user-1", status: "not_started", redirectUrl: null });
    const res = await POST(makeRequest());
    expect(res.status).toBe(409);
  });

  it("creates a session, persists pending + ref, and returns the redirect URL", async () => {
    createSessionMock.mockResolvedValue({ providerRef: "sess-abc", status: "pending", redirectUrl: "https://verify.didit.me/session/xyz" });
    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.redirectUrl).toBe("https://verify.didit.me/session/xyz");
    expect(createSessionMock).toHaveBeenCalledWith({
      userId: "user-1",
      email: "t@example.com",
      returnUrl: "http://localhost/dashboard/provider/verification?kyc=return",
    });
    expect(adminUpdateEq).toHaveBeenCalledWith("id", "user-1");
  });

  it("502s when the provider errors", async () => {
    createSessionMock.mockRejectedValue(new Error("didit down"));
    const res = await POST(makeRequest());
    expect(res.status).toBe(502);
  });

  it("500s when persisting the ref fails", async () => {
    createSessionMock.mockResolvedValue({ providerRef: "sess-abc", status: "pending", redirectUrl: "https://verify.didit.me/session/xyz" });
    adminUpdateEq.mockResolvedValue({ error: { message: "boom" } });
    const res = await POST(makeRequest());
    expect(res.status).toBe(500);
  });
});
