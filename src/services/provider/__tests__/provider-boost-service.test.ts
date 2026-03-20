/**
 * Tests for provider-boost-service.
 *
 * Functions under contract:
 *  - getActiveBoosts(supabase, providerId)
 *  - createBoostCheckout(providerId, config)
 *
 * Boost pricing (per week):
 *  - featured_profile: 2900 pence (£29)
 *  - area_spotlight:   4900 pence (£49)
 *  - category_top:     7900 pence (£79)
 *
 * All monetary values are in pence (GBP x 100).
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

// ---------------------------------------------------------------------------
// Mock Stripe
// ---------------------------------------------------------------------------

const mockSessionCreate = vi.fn();

vi.mock("stripe", () => {
  // Cannot reference outer `mockSessionCreate` directly due to hoisting.
  // Instead, use vi.hoisted to share the reference.
  return {
    default: class MockStripe {
      checkout = {
        sessions: {
          // We assign the real mock in beforeEach via the imported reference
          create: (...args: unknown[]) => mockSessionCreate(...args),
        },
      };
    },
  };
});

import {
  getActiveBoosts,
  createBoostCheckout,
} from "../provider-boost-service";

import type { BoostCheckoutConfig } from "../provider-boost-service";

// ---------------------------------------------------------------------------
// Helpers to build a chainable Supabase query mock
// ---------------------------------------------------------------------------

function makeQueryMock(resolveValue: unknown) {
  const chain: Record<string, unknown> = {};
  const methods = [
    "from", "select", "insert", "update", "upsert", "delete",
    "eq", "neq", "in", "not", "gte", "lte", "gt", "lt",
    "order", "limit", "range", "maybeSingle", "single",
  ];
  for (const m of methods) {
    chain[m] = vi.fn(() => chain);
  }
  (chain["maybeSingle"] as ReturnType<typeof vi.fn>).mockResolvedValue(resolveValue);
  (chain["single"] as ReturnType<typeof vi.fn>).mockResolvedValue(resolveValue);
  (chain as unknown as { then: Promise<unknown>["then"] }).then = Promise.resolve(
    resolveValue,
  ).then.bind(Promise.resolve(resolveValue));
  return chain as unknown as ReturnType<typeof import("@supabase/supabase-js").createClient>;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

const activeBoosts = [
  {
    id: "boost-1",
    provider_id: "provider-1",
    boost_type: "featured_profile" as const,
    coverage_area: null,
    duration_days: 7,
    starts_at: new Date().toISOString(),
    ends_at: futureDate,
    stripe_payment_intent_id: "pi_test_1",
    amount_paid: 2900,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "boost-2",
    provider_id: "provider-1",
    boost_type: "area_spotlight" as const,
    coverage_area: "London",
    duration_days: 14,
    starts_at: new Date().toISOString(),
    ends_at: futureDate,
    stripe_payment_intent_id: "pi_test_2",
    amount_paid: 9800,
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

const populatedClient = makeQueryMock({ data: activeBoosts, error: null });
const emptyClient = makeQueryMock({ data: [], error: null });

// ---------------------------------------------------------------------------
// getActiveBoosts
// ---------------------------------------------------------------------------

describe("getActiveBoosts", () => {
  it("returns array of active boosts (is_active=true, ends_at > now)", async () => {
    const result = await getActiveBoosts(populatedClient, "provider-1");

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    for (const boost of result) {
      expect(boost).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          provider_id: expect.any(String),
          boost_type: expect.any(String),
          duration_days: expect.any(Number),
          is_active: true,
        }),
      );
    }
  });

  it("returns empty array when no boosts are active", async () => {
    const result = await getActiveBoosts(emptyClient, "provider-new");

    expect(result).toEqual([]);
  });

  it("filters expired boosts (ends_at < now)", async () => {
    // The query mock uses .gt("ends_at", now) so expired boosts are excluded.
    // We verify the client calls .eq("is_active", true) and .gt("ends_at", ...)
    const eqSpy = populatedClient.eq as unknown as ReturnType<typeof vi.fn>;
    const gtSpy = populatedClient.gt as unknown as ReturnType<typeof vi.fn>;

    await getActiveBoosts(populatedClient, "provider-1");

    expect(eqSpy).toHaveBeenCalledWith("is_active", true);
    expect(gtSpy).toHaveBeenCalledWith("ends_at", expect.any(String));
  });
});

// ---------------------------------------------------------------------------
// createBoostCheckout
// ---------------------------------------------------------------------------

describe("createBoostCheckout", () => {
  beforeEach(() => {
    mockSessionCreate.mockReset();
    mockSessionCreate.mockResolvedValue({
      url: "https://checkout.stripe.com/test",
      id: "cs_test_123",
    });
  });

  it("returns checkout_url string", async () => {
    const config: BoostCheckoutConfig = {
      boost_type: "featured_profile",
      duration_days: 7,
      amount_pence: 2900,
    };

    const result = await createBoostCheckout("provider-1", config);

    expect(result).toEqual(
      expect.objectContaining({
        checkout_url: expect.any(String),
      }),
    );
    expect(result.checkout_url).toContain("https://");
  });

  it("creates Stripe session with correct line item for featured_profile", async () => {
    const config: BoostCheckoutConfig = {
      boost_type: "featured_profile",
      duration_days: 7,
      amount_pence: 2900,
    };

    await createBoostCheckout("provider-1", config);

    expect(mockSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "payment",
        line_items: expect.arrayContaining([
          expect.objectContaining({
            price_data: expect.objectContaining({
              currency: "gbp",
              unit_amount: 2900,
            }),
            quantity: 1,
          }),
        ]),
        metadata: expect.objectContaining({
          provider_id: "provider-1",
          boost_type: "featured_profile",
        }),
      }),
    );
  });

  it("creates Stripe session with correct amount for area_spotlight", async () => {
    const config: BoostCheckoutConfig = {
      boost_type: "area_spotlight",
      coverage_area: "Manchester",
      duration_days: 7,
      amount_pence: 4900,
    };

    await createBoostCheckout("provider-1", config);

    expect(mockSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: expect.arrayContaining([
          expect.objectContaining({
            price_data: expect.objectContaining({
              unit_amount: 4900,
            }),
          }),
        ]),
      }),
    );
  });

  it("creates Stripe session with correct amount for category_top", async () => {
    const config: BoostCheckoutConfig = {
      boost_type: "category_top",
      duration_days: 7,
      amount_pence: 7900,
    };

    await createBoostCheckout("provider-1", config);

    expect(mockSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: expect.arrayContaining([
          expect.objectContaining({
            price_data: expect.objectContaining({
              unit_amount: 7900,
            }),
          }),
        ]),
      }),
    );
  });

  it("includes coverage_area in metadata when provided", async () => {
    const config: BoostCheckoutConfig = {
      boost_type: "area_spotlight",
      coverage_area: "Birmingham",
      duration_days: 14,
      amount_pence: 9800,
    };

    await createBoostCheckout("provider-1", config);

    expect(mockSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          coverage_area: "Birmingham",
          duration_days: "14",
        }),
      }),
    );
  });

  it("throws when Stripe returns no URL", async () => {
    mockSessionCreate.mockResolvedValueOnce({ url: null, id: "cs_test_fail" });

    const config: BoostCheckoutConfig = {
      boost_type: "featured_profile",
      duration_days: 7,
      amount_pence: 2900,
    };

    await expect(createBoostCheckout("provider-1", config)).rejects.toThrow(
      "Stripe Checkout session created but no URL returned",
    );
  });

  it("passes correct success and cancel URLs", async () => {
    const config: BoostCheckoutConfig = {
      boost_type: "featured_profile",
      duration_days: 7,
      amount_pence: 2900,
    };

    await createBoostCheckout("provider-1", config);

    expect(mockSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        success_url: expect.stringContaining("/dashboard/provider/boost/success"),
        cancel_url: expect.stringContaining("/dashboard/provider/boost"),
      }),
    );
  });

  it("includes duration in product name", async () => {
    const config: BoostCheckoutConfig = {
      boost_type: "featured_profile",
      duration_days: 14,
      amount_pence: 5800,
    };

    await createBoostCheckout("provider-1", config);

    expect(mockSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: expect.arrayContaining([
          expect.objectContaining({
            price_data: expect.objectContaining({
              product_data: expect.objectContaining({
                name: expect.stringContaining("14 days"),
              }),
            }),
          }),
        ]),
      }),
    );
  });
});
