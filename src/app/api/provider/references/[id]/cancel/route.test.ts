import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockCreateClient, mockCreateAdminClient, mockCancelReferenceInvitation, mockLimit } =
  vi.hoisted(() => ({
    mockCreateClient: vi.fn(),
    mockCreateAdminClient: vi.fn(() => ({})),
    mockCancelReferenceInvitation: vi.fn(),
    mockLimit: vi.fn(),
  }));

vi.mock("@/lib/supabase/server", () => ({ createClient: mockCreateClient }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mockCreateAdminClient }));
vi.mock("@/lib/cache/redis", () => ({
  createRateLimiter: () => ({ limit: mockLimit }),
}));
vi.mock("@/services/provider/reference-invitation-service", () => ({
  cancelReferenceInvitation: mockCancelReferenceInvitation,
}));

import { POST } from "./route";

const REF_ID = "11111111-1111-4111-8111-111111111111";
const params = Promise.resolve({ id: REF_ID });

function makeRequest(): Request {
  return new Request(`http://localhost/api/provider/references/${REF_ID}/cancel`, {
    method: "POST",
  });
}

function authAs(user: { id: string } | null) {
  const accessUser = user
    ? {
        ...user,
        email_confirmed_at: "2026-07-01T00:00:00Z",
        app_metadata: { role: "service_provider" },
      }
    : null;
  const row = (data: unknown) => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
  });
  mockCreateClient.mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: accessUser }, error: null }) },
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return row({ active_role: "service_provider", provider_verification_status: "verified" });
      }
      if (table === "subscriptions") return row({ status: "active" });
      if (table === "stripe_connect_accounts") {
        return row({ charges_enabled: true, payouts_enabled: true });
      }
      return row(null);
    }),
    rpc: vi.fn().mockResolvedValue({
      data: [{ peer_count: 3, client_count: 3, grandfathered: false, gate_complete: true }],
      error: null,
    }),
  });
}

beforeEach(() => {
  mockCreateClient.mockReset();
  mockCancelReferenceInvitation.mockReset();
  mockLimit.mockReset();
  mockLimit.mockResolvedValue({ success: true });
});

describe("POST /api/provider/references/[id]/cancel", () => {
  it("returns 401 when unauthenticated", async () => {
    authAs(null);
    const res = await POST(makeRequest(), { params });
    expect(res.status).toBe(401);
    expect(mockCancelReferenceInvitation).not.toHaveBeenCalled();
  });

  it("returns 404 for a non-UUID id without hitting the service", async () => {
    authAs({ id: "prov-1" });
    const badParams = Promise.resolve({ id: "not-a-uuid" });
    const res = await POST(makeRequest(), { params: badParams });
    expect(res.status).toBe(404);
    expect(mockCancelReferenceInvitation).not.toHaveBeenCalled();
  });

  it("returns 200 on success", async () => {
    authAs({ id: "prov-1" });
    mockCancelReferenceInvitation.mockResolvedValue({ success: true });
    const res = await POST(makeRequest(), { params });
    expect(res.status).toBe(200);
    expect(mockCancelReferenceInvitation).toHaveBeenCalledWith(
      expect.anything(),
      { referenceId: REF_ID, providerId: "prov-1" },
    );
  });

  it("maps not_cancellable to 409", async () => {
    authAs({ id: "prov-1" });
    mockCancelReferenceInvitation.mockResolvedValue({
      success: false,
      code: "not_cancellable",
      error: "no",
    });
    const res = await POST(makeRequest(), { params });
    expect(res.status).toBe(409);
  });

  it("maps not_found to 404", async () => {
    authAs({ id: "prov-1" });
    mockCancelReferenceInvitation.mockResolvedValue({
      success: false,
      code: "not_found",
      error: "gone",
    });
    const res = await POST(makeRequest(), { params });
    expect(res.status).toBe(404);
  });
});
