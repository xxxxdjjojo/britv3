import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

import {
  getOrCreateReferralCode,
  getReferralDashboard,
  attributeReferral,
  advanceReferralStatus,
  validateReferralCode,
} from "@/services/referrals/unified-referral-service";

// Mock nanoid
vi.mock("nanoid", () => ({
  nanoid: vi.fn(() => "ABCD1234"),
}));

function createMockSupabase(overrides: Record<string, unknown> = {}) {
  const defaultResult = { data: null, error: null };
  const mockChain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(overrides.single ?? defaultResult),
    maybeSingle: vi.fn().mockResolvedValue(overrides.maybeSingle ?? defaultResult),
  };
  return {
    from: vi.fn().mockReturnValue(mockChain),
    rpc: vi.fn().mockResolvedValue(defaultResult),
    _chain: mockChain,
  } as never;
}

describe("getOrCreateReferralCode", () => {
  it("returns existing code if found", async () => {
    const supabase = createMockSupabase({
      maybeSingle: { data: { code: "ABC12345" }, error: null },
    });
    const code = await getOrCreateReferralCode(supabase, "user-1");
    expect(code).toBe("ABC12345");
  });

  it("retries with new nanoid on unique constraint violation", async () => {
    const { nanoid } = await import("nanoid");
    const mockNanoid = vi.mocked(nanoid);
    mockNanoid.mockReturnValueOnce("COLLIDE1").mockReturnValueOnce("NEWCODE2");

    const supabase = createMockSupabase({
      maybeSingle: { data: null, error: null },
    });
    const chain = (supabase as unknown as { _chain: Record<string, ReturnType<typeof vi.fn>> })._chain;
    chain.insert.mockReturnValueOnce({
      ...chain,
      single: vi.fn().mockResolvedValue({ data: null, error: { code: "23505", message: "unique violation" } }),
    });
    chain.insert.mockReturnValueOnce({
      ...chain,
      single: vi.fn().mockResolvedValue({ data: { code: "NEWCODE2" }, error: null }),
    });

    const code = await getOrCreateReferralCode(supabase, "user-1");
    expect(code).toBeDefined();
  });
});

describe("attributeReferral", () => {
  it("creates a referral row with pending status", async () => {
    const supabase = createMockSupabase({
      maybeSingle: { data: { user_id: "referrer-1" }, error: null },
      single: { data: { id: "ref-1" }, error: null },
    });
    await expect(
      attributeReferral(supabase, "ABC12345", "new-user-1"),
    ).resolves.not.toThrow();
  });

  it("prevents self-referral", async () => {
    const supabase = createMockSupabase({
      maybeSingle: { data: { user_id: "user-1" }, error: null },
    });
    await attributeReferral(supabase, "ABC12345", "user-1");
    const fromCalls = (supabase as unknown as { from: ReturnType<typeof vi.fn> }).from.mock.calls;
    const referralInserts = fromCalls.filter(
      (call: string[]) => call[0] === "referrals"
    );
    expect(referralInserts.length).toBe(0);
  });
});

describe("advanceReferralStatus", () => {
  it("prevents status regression (rewarded cannot go back to pending)", async () => {
    const supabase = createMockSupabase({
      maybeSingle: { data: { id: "ref-1", referrer_id: "user-1", status: "rewarded" }, error: null },
    });
    const result = await advanceReferralStatus(supabase, "user-2", "rewarded");
    expect(result).toBeNull();
  });

  it("detects tier change when advancing to rewarded", async () => {
    const supabase = createMockSupabase({
      maybeSingle: { data: { id: "ref-1", referrer_id: "user-1", status: "pending" }, error: null },
    });
    const chain = (supabase as unknown as { _chain: Record<string, ReturnType<typeof vi.fn>> })._chain;
    // Profile query's .single() returns previous tier
    chain.single.mockResolvedValueOnce({ data: { referral_tier: "none" }, error: null });
    // Mock .select() calls in order:
    // 1st: referral fetch .select("id, referrer_id, status") → default chain
    // 2nd: profile .select("referral_tier") → default chain
    // 3rd: count .select("id", { count }) → custom chain that resolves count
    chain.select
      .mockReturnValueOnce(chain)
      .mockReturnValueOnce(chain)
      .mockReturnValueOnce({
        ...chain,
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ count: 1, error: null }),
        }),
      });

    const result = await advanceReferralStatus(supabase, "user-2", "rewarded");
    expect(result).not.toBeNull();
    expect(result?.tierChanged).toBe(true);
    expect(result?.newTier).toBe("connector");
  });
});

describe("getReferralDashboard", () => {
  it("returns stats with tier calculation", async () => {
    const supabase = createMockSupabase({
      maybeSingle: { data: { code: "ABC12345" }, error: null },
    });
    const chain = (supabase as unknown as { _chain: Record<string, ReturnType<typeof vi.fn>> })._chain;
    // .order().limit() chain — limit() is the final awaitable
    chain.limit.mockResolvedValueOnce({
      data: [
        { id: "1", status: "rewarded", provider_state: "credited", referral_code: "ABC12345", referred_name: "Dave", created_at: "2026-01-01", converted_at: "2026-01-15", referrer_id: "user-1", referred_id: "user-2", track: "trade_to_trade" },
        { id: "2", status: "rewarded", provider_state: "credited", referral_code: "ABC12345", referred_name: "Sarah", created_at: "2026-01-10", converted_at: "2026-01-25", referrer_id: "user-1", referred_id: "user-3", track: "trade_to_trade" },
        { id: "3", status: "rewarded", provider_state: "credited", referral_code: "ABC12345", referred_name: "Mike", created_at: "2026-02-01", converted_at: "2026-02-15", referrer_id: "user-1", referred_id: "user-4", track: "trade_to_trade" },
      ],
      error: null,
    });

    const stats = await getReferralDashboard(supabase, "user-1");
    expect(stats.tier).toBe("ambassador");
    expect(stats.successful_referrals).toBe(3);
    expect(stats.referral_code).toBe("ABC12345");
  });
});

describe("validateReferralCode", () => {
  it("returns null for codes shorter than 6 chars", async () => {
    const supabase = createMockSupabase();
    const result = await validateReferralCode(supabase, "AB");
    expect(result).toBeNull();
  });
});
