/**
 * Tests for the provider transaction gate.
 *
 * A trader cannot SEND live quotes/invoices or take payment until:
 *  - email verified
 *  - admin approved (provider_verification_status = 'verified')
 *  - an active/trialing subscription exists
 *  - a payout account is connected (Stripe charges + payouts enabled)
 *
 * Pages remain browsable (proxy exempts them); only the transacting actions
 * are gated. The check is server-side and returns a typed reason on failure.
 */

import { describe, expect, it, vi } from "vitest";

import { checkProviderCanTransact } from "../provider-transaction-gate";

type ProfileRow = {
  active_role: string;
  provider_verification_status: string | null;
} | null;
type SubRow = { status: string } | null;
type ConnectRow = { charges_enabled: boolean; payouts_enabled: boolean } | null;

function makeSupabaseMock(opts: {
  profile?: ProfileRow;
  subscription?: SubRow;
  connect?: ConnectRow;
  gate?: {
    peer_count: number;
    client_count: number;
    grandfathered: boolean;
    gate_complete: boolean;
  };
}) {
  const {
    profile = {
      active_role: "service_provider",
      provider_verification_status: "verified",
    },
    subscription = { status: "active" },
    connect = { charges_enabled: true, payouts_enabled: true },
    gate = {
      peer_count: 3,
      client_count: 3,
      grandfathered: false,
      gate_complete: true,
    },
  } = opts;

  const single = (data: unknown) => ({
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
  });

  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "profiles") return { select: vi.fn().mockReturnValue(single(profile)) };
      if (table === "subscriptions") return { select: vi.fn().mockReturnValue(single(subscription)) };
      if (table === "stripe_connect_accounts") return { select: vi.fn().mockReturnValue(single(connect)) };
      return { select: vi.fn().mockReturnValue(single(null)) };
    }),
    rpc: vi.fn().mockResolvedValue({ data: [gate], error: null }),
  };
}

describe("checkProviderCanTransact", () => {
  it("allows a fully set-up trader", async () => {
    const supabase = makeSupabaseMock({});
    const result = await checkProviderCanTransact(supabase as never, "user-1", {
      emailConfirmed: true,
    });
    expect(result.allowed).toBe(true);
  });

  it("blocks when email is unverified", async () => {
    const supabase = makeSupabaseMock({});
    const result = await checkProviderCanTransact(supabase as never, "user-1", {
      emailConfirmed: false,
    });
    expect(result).toMatchObject({ allowed: false, reason: "email_unverified" });
  });

  it("blocks when not admin-approved (pending_review)", async () => {
    const supabase = makeSupabaseMock({
      profile: {
        active_role: "service_provider",
        provider_verification_status: "pending_review",
      },
    });
    const result = await checkProviderCanTransact(supabase as never, "user-1", {
      emailConfirmed: true,
    });
    expect(result).toMatchObject({ allowed: false, reason: "admin_unverified" });
  });

  it("blocks when subscription is not active", async () => {
    const supabase = makeSupabaseMock({ subscription: { status: "canceled" } });
    const result = await checkProviderCanTransact(supabase as never, "user-1", {
      emailConfirmed: true,
    });
    expect(result).toMatchObject({ allowed: false, reason: "subscription_inactive" });
  });

  it("blocks transactions when the provider has not completed the vouch gate", async () => {
    const supabase = makeSupabaseMock({
      gate: {
        peer_count: 3,
        client_count: 2,
        grandfathered: false,
        gate_complete: false,
      },
    });

    const result = await checkProviderCanTransact(supabase as never, "user-1", {
      emailConfirmed: true,
    });

    expect(result).toMatchObject({ allowed: false, reason: "vouch_incomplete" });
  });

  it("blocks when no subscription row exists", async () => {
    const supabase = makeSupabaseMock({ subscription: null });
    const result = await checkProviderCanTransact(supabase as never, "user-1", {
      emailConfirmed: true,
    });
    expect(result).toMatchObject({ allowed: false, reason: "subscription_inactive" });
  });

  it("blocks when payout account is not connected (charges disabled)", async () => {
    const supabase = makeSupabaseMock({
      connect: { charges_enabled: false, payouts_enabled: false },
    });
    const result = await checkProviderCanTransact(supabase as never, "user-1", {
      emailConfirmed: true,
    });
    expect(result).toMatchObject({ allowed: false, reason: "stripe_connect_incomplete" });
  });

  it("treats a trialing subscription as active", async () => {
    const supabase = makeSupabaseMock({ subscription: { status: "trialing" } });
    const result = await checkProviderCanTransact(supabase as never, "user-1", {
      emailConfirmed: true,
    });
    expect(result.allowed).toBe(true);
  });

  it("returns a human-readable message on every failure", async () => {
    const supabase = makeSupabaseMock({ subscription: null });
    const result = await checkProviderCanTransact(supabase as never, "user-1", {
      emailConfirmed: true,
    });
    if (result.allowed) throw new Error("expected blocked");
    expect(typeof result.message).toBe("string");
    expect(result.message.length).toBeGreaterThan(0);
  });
});
