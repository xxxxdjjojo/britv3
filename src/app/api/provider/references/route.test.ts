import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockCreateClient,
  mockCreateAdminClient,
  mockCreateReferenceInvitation,
  mockInngestSend,
  mockLimit,
  mockProviderMaybeSingle,
} = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  mockCreateAdminClient: vi.fn(),
  mockCreateReferenceInvitation: vi.fn(),
  mockInngestSend: vi.fn(),
  mockLimit: vi.fn(),
  mockProviderMaybeSingle: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: mockCreateClient }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mockCreateAdminClient }));
vi.mock("@/lib/cache/redis", () => ({
  createRateLimiter: () => ({ limit: mockLimit }),
}));
vi.mock("@/services/provider/reference-invitation-service", () => ({
  createReferenceInvitation: mockCreateReferenceInvitation,
}));
vi.mock("@/inngest/client", () => ({ inngest: { send: mockInngestSend } }));

import { POST } from "./route";

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/provider/references", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function authAs(user: { id: string; email?: string } | null) {
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

const VALID_BODY = {
  referee_name: "Jane Smith",
  referee_email: "jane@example.com",
  reference_type: "peer",
};

// The route calls admin.from("service_provider_details").select().eq().maybeSingle()
// to provider-gate. This builds a chainable admin client whose maybeSingle
// resolves to mockProviderMaybeSingle's value.
function adminClientWithProviderLookup() {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.maybeSingle = mockProviderMaybeSingle;
  return { from: vi.fn(() => chain) };
}

beforeEach(() => {
  mockCreateClient.mockReset();
  mockCreateReferenceInvitation.mockReset();
  mockInngestSend.mockReset();
  mockInngestSend.mockResolvedValue(undefined);
  mockLimit.mockReset();
  mockLimit.mockResolvedValue({ success: true });
  mockProviderMaybeSingle.mockReset();
  // Default: the authed user IS a provider (row exists).
  mockProviderMaybeSingle.mockResolvedValue({ data: { user_id: "prov-1" }, error: null });
  mockCreateAdminClient.mockReset();
  mockCreateAdminClient.mockImplementation(adminClientWithProviderLookup);
});

describe("POST /api/provider/references", () => {
  it("returns 401 when unauthenticated", async () => {
    authAs(null);
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(401);
    expect(mockCreateReferenceInvitation).not.toHaveBeenCalled();
  });

  it("returns 429 when the HTTP rate limit is exceeded", async () => {
    authAs({ id: "prov-1", email: "prov@example.com" });
    mockLimit.mockResolvedValue({ success: false });
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(429);
    expect(mockCreateReferenceInvitation).not.toHaveBeenCalled();
  });

  it("returns 403 when the user has no service_provider_details row", async () => {
    authAs({ id: "prov-1", email: "prov@example.com" });
    mockProviderMaybeSingle.mockResolvedValue({ data: null, error: null });
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(403);
    expect(mockCreateReferenceInvitation).not.toHaveBeenCalled();
  });

  it("returns 400 on an invalid body", async () => {
    authAs({ id: "prov-1", email: "prov@example.com" });
    const res = await POST(makeRequest({ referee_name: "x" }));
    expect(res.status).toBe(400);
    expect(mockCreateReferenceInvitation).not.toHaveBeenCalled();
  });

  it("returns 201 with the id on success and emits the requested event", async () => {
    authAs({ id: "prov-1", email: "prov@example.com" });
    mockCreateReferenceInvitation.mockResolvedValue({ success: true, id: "ref-9" });

    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toEqual({ id: "ref-9" });

    // provider_id + providerEmail come from the authed user.
    expect(mockCreateReferenceInvitation).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ providerId: "prov-1", providerEmail: "prov@example.com" }),
    );
    expect(mockInngestSend).toHaveBeenCalledWith({
      name: "provider/reference.requested",
      data: { referenceId: "ref-9" },
    });
  });

  it("still returns 201 when the inngest send throws", async () => {
    authAs({ id: "prov-1", email: "prov@example.com" });
    mockCreateReferenceInvitation.mockResolvedValue({ success: true, id: "ref-10" });
    mockInngestSend.mockRejectedValue(new Error("inngest down"));

    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(201);
  });

  it("maps duplicate to 409", async () => {
    authAs({ id: "prov-1", email: "prov@example.com" });
    mockCreateReferenceInvitation.mockResolvedValue({
      success: false,
      code: "duplicate",
      error: "dup",
    });
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(409);
    expect(mockInngestSend).not.toHaveBeenCalled();
  });

  it("maps self_vouch to 422", async () => {
    authAs({ id: "prov-1", email: "prov@example.com" });
    mockCreateReferenceInvitation.mockResolvedValue({
      success: false,
      code: "self_vouch",
      error: "self",
    });
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(422);
  });

  it("maps invalid to 400", async () => {
    authAs({ id: "prov-1", email: "prov@example.com" });
    mockCreateReferenceInvitation.mockResolvedValue({
      success: false,
      code: "invalid",
      error: "bad",
    });
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(400);
  });

  it("maps an uncoded failure to 500", async () => {
    authAs({ id: "prov-1", email: "prov@example.com" });
    mockCreateReferenceInvitation.mockResolvedValue({ success: false, error: "oops" });
    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(500);
  });
});
