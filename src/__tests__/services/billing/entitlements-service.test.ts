// src/__tests__/services/billing/entitlements-service.test.ts
import { describe, it, expect, vi } from "vitest";

import { getUserEntitlements } from "@/services/billing/entitlements-service";

function createMockSupabase(subscriptionData: unknown) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: subscriptionData,
              error: null,
            }),
          }),
          maybeSingle: vi.fn().mockResolvedValue({
            data: subscriptionData,
            error: null,
          }),
        }),
      }),
    }),
  } as never;
}

describe("getUserEntitlements", () => {
  it("returns features for a subscribed provider_professional", async () => {
    const supabase = createMockSupabase({
      plan_name: "provider_professional",
      status: "active",
    });

    const result = await getUserEntitlements(supabase, "user-123");
    expect(result.planId).toBe("provider_professional");
    expect(result.features.has("QUOTES_UNLIMITED")).toBe(true);
    expect(result.features.has("LEADS_PRIORITY")).toBe(true);
  });

  it("returns empty features for user with no subscription", async () => {
    const supabase = createMockSupabase(null);

    const result = await getUserEntitlements(supabase, "user-456");
    expect(result.planId).toBeNull();
    expect(result.features.size).toBe(0);
  });

  it("returns empty features for cancelled subscription", async () => {
    const supabase = createMockSupabase({
      plan_name: "provider_elite",
      status: "canceled",
    });

    const result = await getUserEntitlements(supabase, "user-789");
    expect(result.planId).toBeNull();
    expect(result.features.size).toBe(0);
  });

  it("includes features for trialing subscription", async () => {
    const supabase = createMockSupabase({
      plan_name: "provider_member",
      status: "trialing",
    });

    const result = await getUserEntitlements(supabase, "user-trial");
    expect(result.planId).toBe("provider_member");
    expect(result.features.has("QUOTES_BASIC")).toBe(true);
  });
});
