import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockCreateClient,
  mockCreateAdminClient,
  mockResendReferenceInvitation,
  mockGetVouchRules,
  mockInngestSend,
  mockLimit,
} = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  mockCreateAdminClient: vi.fn(() => ({})),
  mockResendReferenceInvitation: vi.fn(),
  mockGetVouchRules: vi.fn(),
  mockInngestSend: vi.fn(),
  mockLimit: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: mockCreateClient }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mockCreateAdminClient }));
vi.mock("@/lib/cache/redis", () => ({
  createRateLimiter: () => ({ limit: mockLimit }),
}));
vi.mock("@/services/provider/reference-invitation-service", () => ({
  resendReferenceInvitation: mockResendReferenceInvitation,
}));
vi.mock("@/services/provider/vouch-rules-service", () => ({
  getVouchRules: mockGetVouchRules,
}));
vi.mock("@/inngest/client", () => ({ inngest: { send: mockInngestSend } }));

import { POST } from "./route";

const REF_ID = "22222222-2222-4222-8222-222222222222";
const params = Promise.resolve({ id: REF_ID });

function makeRequest(): Request {
  return new Request(`http://localhost/api/provider/references/${REF_ID}/resend`, {
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
      if (table === "subscriptions") {
        return row({ status: "active", role: "provider" });
      }
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
  mockResendReferenceInvitation.mockReset();
  mockInngestSend.mockReset();
  mockInngestSend.mockResolvedValue(undefined);
  mockGetVouchRules.mockResolvedValue({ resend_cooldown_hours: 24 });
  mockLimit.mockReset();
  mockLimit.mockResolvedValue({ success: true });
});

describe("POST /api/provider/references/[id]/resend", () => {
  it("returns 401 when unauthenticated", async () => {
    authAs(null);
    const res = await POST(makeRequest(), { params });
    expect(res.status).toBe(401);
  });

  it("returns 429 when the HTTP rate limit is exceeded", async () => {
    authAs({ id: "prov-1" });
    mockLimit.mockResolvedValue({ success: false });
    const res = await POST(makeRequest(), { params });
    expect(res.status).toBe(429);
    expect(mockResendReferenceInvitation).not.toHaveBeenCalled();
  });

  it("returns 404 for a non-UUID id without hitting the service", async () => {
    authAs({ id: "prov-1" });
    const badParams = Promise.resolve({ id: "not-a-uuid" });
    const res = await POST(makeRequest(), { params: badParams });
    expect(res.status).toBe(404);
    expect(mockResendReferenceInvitation).not.toHaveBeenCalled();
  });

  it("returns 200 on success and emits the resend-requested event", async () => {
    authAs({ id: "prov-1" });
    mockResendReferenceInvitation.mockResolvedValue({ success: true });
    const res = await POST(makeRequest(), { params });
    expect(res.status).toBe(200);
    expect(mockInngestSend).toHaveBeenCalledWith({
      name: "provider/reference.resend-requested",
      data: { referenceId: REF_ID },
    });
  });

  it("still returns 200 when the inngest send throws", async () => {
    authAs({ id: "prov-1" });
    mockResendReferenceInvitation.mockResolvedValue({ success: true });
    mockInngestSend.mockRejectedValue(new Error("inngest down"));
    const res = await POST(makeRequest(), { params });
    expect(res.status).toBe(200);
  });

  it("maps cooldown to 429", async () => {
    authAs({ id: "prov-1" });
    mockResendReferenceInvitation.mockResolvedValue({
      success: false,
      code: "cooldown",
      error: "wait",
    });
    const res = await POST(makeRequest(), { params });
    expect(res.status).toBe(429);
  });

  it("maps max_sends to 429", async () => {
    authAs({ id: "prov-1" });
    mockResendReferenceInvitation.mockResolvedValue({
      success: false,
      code: "max_sends",
      error: "limit",
    });
    const res = await POST(makeRequest(), { params });
    expect(res.status).toBe(429);
  });

  it("maps not_resendable to 409", async () => {
    authAs({ id: "prov-1" });
    mockResendReferenceInvitation.mockResolvedValue({
      success: false,
      code: "not_resendable",
      error: "no",
    });
    const res = await POST(makeRequest(), { params });
    expect(res.status).toBe(409);
  });

  it("maps not_found to 404", async () => {
    authAs({ id: "prov-1" });
    mockResendReferenceInvitation.mockResolvedValue({
      success: false,
      code: "not_found",
      error: "gone",
    });
    const res = await POST(makeRequest(), { params });
    expect(res.status).toBe(404);
  });
});
