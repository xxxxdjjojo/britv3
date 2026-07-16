import { describe, expect, it, vi } from "vitest";
import { getProviderAccessState } from "../provider-access-state";

function query(data: unknown) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
  };
}

describe("getProviderAccessState", () => {
  it("uses the database role even when a stale JWT claims provider access", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return query({
            active_role: "homebuyer",
            provider_verification_status: "verified",
          });
        }
        if (table === "subscriptions") return query({ status: "active" });
        if (table === "stripe_connect_accounts") {
          return query({ charges_enabled: true, payouts_enabled: true });
        }
        return query(null);
      }),
      rpc: vi.fn().mockResolvedValue({
        data: [{
          peer_count: 3,
          client_count: 3,
          grandfathered: true,
          gate_complete: true,
        }],
        error: null,
      }),
    };

    const state = await getProviderAccessState(supabase as never, "user-1", {
      emailConfirmed: true,
      roleHint: "service_provider",
    });

    expect(state.role).toBe("homebuyer");
  });
});
