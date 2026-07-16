import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));

import { createAdminClient } from "@/lib/supabase/admin";
import { getSafePublicVouchedProfile } from "./public-vouched-profile";

function query(result: Record<string, unknown>) {
  const builder = {
    select: vi.fn(),
    eq: vi.fn(),
    is: vi.fn(),
    order: vi.fn(),
    single: vi.fn().mockResolvedValue(result),
    then: (resolve: (value: Record<string, unknown>) => unknown) => Promise.resolve(result).then(resolve),
  };
  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.is.mockReturnValue(builder);
  builder.order.mockReturnValue(builder);
  return builder;
}

describe("getSafePublicVouchedProfile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns only consented attribution after proving raw 3+3 completion", async () => {
    const provider = query({
      data: { user_id: "provider-1", business_name: "North Star Plumbing", slug: "north-star" },
      error: null,
    });
    const peerCount = query({ data: null, error: null, count: 3 });
    const clientCount = query({ data: null, error: null, count: 3 });
    const attributions = query({
      data: [
        {
          voucher_kind: "peer",
          voucher_trade: "Electrician",
          accepted_at: "2026-07-14T10:00:00.000Z",
          profiles: { display_name: "Alex Morgan" },
        },
        {
          voucher_kind: "client",
          voucher_trade: null,
          accepted_at: "2026-07-15T10:00:00.000Z",
          profiles: { display_name: "Sam Taylor" },
        },
      ],
      error: null,
    });
    const from = vi.fn()
      .mockReturnValueOnce(provider)
      .mockReturnValueOnce(peerCount)
      .mockReturnValueOnce(clientCount)
      .mockReturnValueOnce(attributions);
    vi.mocked(createAdminClient).mockReturnValue({ from } as never);

    const profile = await getSafePublicVouchedProfile("north-star");

    expect(profile).toEqual({
      businessName: "North Star Plumbing",
      slug: "north-star",
      attributions: [
        { firstName: "Alex", role: "Electrician", acceptedAt: "2026-07-14T10:00:00.000Z" },
        { firstName: "Sam", role: "Client", acceptedAt: "2026-07-15T10:00:00.000Z" },
      ],
    });
    const publicJson = JSON.stringify(profile);
    for (const forbidden of ["provider-1", "email", "phone", "evidence", "fraud", "uuid", "Morgan", "Taylor"]) {
      expect(publicJson.toLowerCase()).not.toContain(forbidden.toLowerCase());
    }
  });

  it("does not publish a grandfathered provider without genuine raw 3+3 vouches", async () => {
    const from = vi.fn()
      .mockReturnValueOnce(query({
        data: { user_id: "provider-1", business_name: "Legacy Provider", slug: "legacy" },
        error: null,
      }))
      .mockReturnValueOnce(query({ data: null, error: null, count: 2 }))
      .mockReturnValueOnce(query({ data: null, error: null, count: 3 }));
    vi.mocked(createAdminClient).mockReturnValue({ from } as never);

    await expect(getSafePublicVouchedProfile("legacy")).resolves.toBeNull();
  });
});
