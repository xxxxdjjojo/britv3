import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  maybeSingle: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle: mocks.maybeSingle })),
      })),
    })),
  }),
}));

import { GET } from "./route";

describe("GET /api/vouches/invites/:token", () => {
  it("returns only the consent-safe invite projection", async () => {
    mocks.maybeSingle.mockResolvedValue({
      data: {
        id: "request-secret-id",
        provider_id: "provider-secret-id",
        voucher_kind: "client",
        invited_email: "private@example.test",
        status: "pending",
        expires_at: "2026-08-01T00:00:00.000Z",
        profiles: { display_name: "Ada Provider" },
        service_provider_details: { business_name: "Ada Plumbing", primary_trade: "Plumber" },
      },
      error: null,
    });

    const response = await GET(
      new NextRequest("https://truedeed.test/api/vouches/invites/11111111-1111-4111-8111-111111111111"),
      { params: Promise.resolve({ token: "11111111-1111-4111-8111-111111111111" }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      provider: { displayName: "Ada Provider", businessName: "Ada Plumbing", trade: "Plumber" },
      voucherKind: "client",
      status: "pending",
      expiresAt: "2026-08-01T00:00:00.000Z",
    });
    expect(JSON.stringify(body)).not.toMatch(/private@example|secret-id|invited_email|provider_id/i);
  });
});
