import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import { POST } from "./route";

function query(data: unknown) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
  };
}

beforeEach(() => {
  createClientMock.mockReset();
  createClientMock.mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: "provider-1",
            email_confirmed_at: "2026-07-01T00:00:00Z",
            app_metadata: { role: "service_provider" },
          },
        },
        error: null,
      }),
    },
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return query({
          active_role: "service_provider",
          provider_verification_status: "verified",
        });
      }
      if (table === "subscriptions") {
        return query({ status: "active", role: "provider" });
      }
      if (table === "stripe_connect_accounts") {
        return query({ charges_enabled: true, payouts_enabled: true });
      }
      return query({ id: "provider-1" });
    }),
    rpc: vi.fn().mockResolvedValue({
      data: [{
        peer_count: 2,
        client_count: 3,
        grandfathered: false,
        gate_complete: false,
      }],
      error: null,
    }),
  });
  delete process.env.VOUCH_GATE_BYPASS;
});

describe("POST /api/provider/quotes", () => {
  it("rejects an authenticated provider whose vouch gate is incomplete", async () => {
    const response = await POST(
      new NextRequest("https://truedeed.test/api/provider/quotes", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      code: "gate_incomplete",
      reason: "vouch_incomplete",
    });
  });
});
