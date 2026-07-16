import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));

function query(data: unknown) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
  };
}

beforeEach(() => {
  const user = {
    id: "provider-1",
    email_confirmed_at: null,
    app_metadata: { role: "service_provider" },
  };
  createClientMock.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    },
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return query({
          active_role: "service_provider",
          provider_verification_status: "pending_review",
        });
      }
      if (table === "subscriptions") return query(null);
      if (table === "stripe_connect_accounts") return query(null);
      if (table === "service_provider_details") {
        return query({ user_id: "provider-1", business_name: "Example Trade" });
      }
      return query(null);
    }),
    rpc: vi.fn().mockResolvedValue({
      data: [{
        peer_count: 0,
        client_count: 0,
        grandfathered: false,
        gate_complete: false,
      }],
      error: null,
    }),
  });
});

describe("POST /api/provider/certificates", () => {
  it("allows an incomplete provider to use the verification evidence flow", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("https://truedeed.test/api/provider/certificates", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "certificateType is required",
    });
  });
});
