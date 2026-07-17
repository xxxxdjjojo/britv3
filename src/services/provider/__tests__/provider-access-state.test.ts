import { describe, expect, it, vi } from "vitest";
import {
  getProviderAccessState,
  ProviderAccessStateUnavailableError,
} from "../provider-access-state";
import { evaluateProviderAccess } from "../provider-access-policy";

function query(data: unknown) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
  };
}

function queryError(error: unknown) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error }),
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

  it("does not accept another role's active subscription as provider billing", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return query({
            active_role: "service_provider",
            provider_verification_status: "verified",
          });
        }
        if (table === "subscriptions") {
          return query({ status: "active", role: "agent" });
        }
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
    });

    expect(state.subscriptionActive).toBe(false);
  });

  it("treats a provider mid-onboarding with no profile row as incomplete, not an outage", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        // Genuine service_provider whose profiles/spd rows do not exist yet.
        if (table === "profiles") return query(null);
        return query(null);
      }),
      // No gate row either — the vouch RPC returns an empty result set.
      rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    const state = await getProviderAccessState(supabase as never, "user-1", {
      emailConfirmed: true,
      roleHint: "service_provider",
    });

    // Onboarding-incomplete: allowed on the safe progress paths...
    expect(state.role).toBe("service_provider");
    expect(evaluateProviderAccess(state, "progress")).toEqual({ allowed: true });
    // ...but still denied the business paths (gate not weakened).
    expect(evaluateProviderAccess(state, "business").allowed).toBe(false);
    expect(state.adminVerified).toBe(false);
    expect(state.vouchComplete).toBe(false);
    expect(state.subscriptionActive).toBe(false);
  });

  it("does not grant provider access to a non-provider with no profile row", async () => {
    const supabase = {
      from: vi.fn(() => query(null)),
      rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    const state = await getProviderAccessState(supabase as never, "user-1", {
      emailConfirmed: true,
      roleHint: "homebuyer",
    });

    expect(state.role).toBe("homebuyer");
    expect(evaluateProviderAccess(state, "progress").allowed).toBe(false);
  });

  it("still surfaces a genuine database error as an unavailable outage", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return queryError({ message: "connection reset", code: "57P01" });
        }
        return query(null);
      }),
      rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    await expect(
      getProviderAccessState(supabase as never, "user-1", {
        emailConfirmed: true,
        roleHint: "service_provider",
      }),
    ).rejects.toBeInstanceOf(ProviderAccessStateUnavailableError);
  });
});
