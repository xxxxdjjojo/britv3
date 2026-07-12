/**
 * Tests for getProviderDisplay — the shared provider name/trade resolver used by
 * the vouch invitation email and the referee page. Uses a chainable Supabase
 * mock; no real DB.
 */

import { describe, expect, it, vi } from "vitest";

import { getProviderDisplay } from "./provider-display";

/** A chainable query builder whose maybeSingle resolves to `resolveValue`. */
function makeChain(resolveValue: unknown) {
  const chain: Record<string, unknown> = {};
  for (const m of ["from", "select", "eq", "maybeSingle"]) {
    chain[m] = vi.fn(() => chain);
  }
  (chain["maybeSingle"] as ReturnType<typeof vi.fn>).mockResolvedValue(resolveValue);
  return chain;
}

/** Client returning `profileRow` for profiles and `spdRow` for spd. */
function makeClient(opts: { profileRow?: unknown; spdRow?: unknown }) {
  const profileChain = makeChain({ data: opts.profileRow, error: null });
  const spdChain = makeChain({ data: opts.spdRow, error: null });
  return {
    from: vi.fn((table: string) =>
      table === "profiles" ? profileChain : spdChain,
    ),
  } as unknown as Parameters<typeof getProviderDisplay>[0];
}

describe("getProviderDisplay", () => {
  it("humanises the first service_category via CATEGORY_LABELS", async () => {
    const client = makeClient({
      profileRow: { display_name: "Ace Plumbing" },
      spdRow: { services: ["plumber"], business_name: "Ace Plumbing Ltd" },
    });
    const result = await getProviderDisplay(client, "prov-1");
    expect(result.providerName).toBe("Ace Plumbing");
    expect(result.providerTrade).toBe("Plumber");
  });

  it("falls back to business_name when the provider has no services", async () => {
    const client = makeClient({
      profileRow: { display_name: "Handy Homes" },
      spdRow: { services: [], business_name: "Handy Homes Ltd" },
    });
    const result = await getProviderDisplay(client, "prov-1");
    expect(result.providerName).toBe("Handy Homes");
    expect(result.providerTrade).toBe("Handy Homes Ltd");
  });

  it('defaults providerName to "A trader" when no profile row exists', async () => {
    const client = makeClient({
      profileRow: null,
      spdRow: { services: ["electrician"], business_name: null },
    });
    const result = await getProviderDisplay(client, "prov-1");
    expect(result.providerName).toBe("A trader");
    expect(result.providerTrade).toBe("Electrician");
  });

  it('defaults to "A trader" with undefined trade when both reads are null', async () => {
    const client = makeClient({ profileRow: null, spdRow: null });
    const result = await getProviderDisplay(client, "prov-1");
    expect(result.providerName).toBe("A trader");
    expect(result.providerTrade).toBeUndefined();
  });
});
