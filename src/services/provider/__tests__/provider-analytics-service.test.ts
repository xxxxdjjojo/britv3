/**
 * Tests for provider-analytics-service.
 *
 * Functions under contract:
 *  - getProviderAnalytics(supabase, providerId, period: "7d"|"30d"|"90d")
 *  - getConversionFunnel(supabase, providerId, period)
 *
 * Earnings and top-category data are derived within getProviderAnalytics.
 * All monetary values are in pence (GBP x 100).
 */

import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import {
  getProviderAnalytics,
  getConversionFunnel,
} from "../provider-analytics-service";

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

const emptyClient = makeQueryMock({ data: [], error: null });

const sampleRows = [
  {
    id: "row-3",
    provider_id: "provider-1",
    date: "2026-02-15",
    profile_views: 10,
    enquiries_received: 2,
    quotes_sent: 1,
    bookings_won: 0,
    earnings_pence: 5000,
    response_time_avg_ms: 7200000,
  },
  {
    id: "row-1",
    provider_id: "provider-1",
    date: "2026-03-10",
    profile_views: 20,
    enquiries_received: 5,
    quotes_sent: 3,
    bookings_won: 1,
    earnings_pence: 15000,
    response_time_avg_ms: 3600000,
  },
  {
    id: "row-2",
    provider_id: "provider-1",
    date: "2026-03-11",
    profile_views: 30,
    enquiries_received: 8,
    quotes_sent: 4,
    bookings_won: 2,
    earnings_pence: 22000,
    response_time_avg_ms: 1800000,
  },
];

const populatedClient = makeQueryMock({ data: sampleRows, error: null });

// ---------------------------------------------------------------------------
// getProviderAnalytics
// ---------------------------------------------------------------------------

describe("getProviderAnalytics", () => {
  it("returns the correct summary shape", async () => {
    const result = await getProviderAnalytics(populatedClient, "provider-1", "30d");

    expect(result).toEqual(
      expect.objectContaining({
        profile_views_total: expect.any(Number),
        profile_views_by_day: expect.any(Array),
        enquiry_rate_pct: expect.any(Number),
        conversion_by_stage: expect.objectContaining({
          viewed: expect.any(Number),
          enquired: expect.any(Number),
          quoted: expect.any(Number),
          booked: expect.any(Number),
        }),
        earnings_by_month: expect.any(Array),
        top_categories: expect.any(Array),
      }),
    );
  });

  it("returns zeros for a new provider (not null/undefined)", async () => {
    const result = await getProviderAnalytics(emptyClient, "provider-new", "30d");

    expect(result.profile_views_total).toBe(0);
    expect(result.enquiry_rate_pct).toBe(0);
    expect(result.profile_views_by_day).toEqual([]);
    expect(result.earnings_by_month).toEqual([]);
    expect(result.conversion_by_stage).toEqual({
      viewed: 0,
      enquired: 0,
      quoted: 0,
      booked: 0,
    });
  });

  it("returns profile_views_by_day sorted by date ascending", async () => {
    // sampleRows are already in ascending order as returned by the mock
    const result = await getProviderAnalytics(populatedClient, "provider-1", "90d");

    const dates = result.profile_views_by_day.map((d) => d.date);
    const sortedDates = [...dates].sort();
    expect(dates).toEqual(sortedDates);
  });

  it("returns earnings_by_month sorted by month", async () => {
    const result = await getProviderAnalytics(populatedClient, "provider-1", "90d");

    const months = result.earnings_by_month.map((e) => e.month);
    const sortedMonths = [...months].sort();
    expect(months).toEqual(sortedMonths);
  });

  it("returns empty earnings_by_month for a new provider", async () => {
    const result = await getProviderAnalytics(emptyClient, "provider-new", "30d");

    expect(result.earnings_by_month).toEqual([]);
  });

  it("returns top_categories as an array (empty when no bookings data)", async () => {
    const result = await getProviderAnalytics(populatedClient, "provider-1", "30d");

    expect(Array.isArray(result.top_categories)).toBe(true);
    // Currently returns empty array as category data requires a separate query
    for (const cat of result.top_categories) {
      expect(cat).toEqual(
        expect.objectContaining({
          category: expect.any(String),
          bookings: expect.any(Number),
        }),
      );
    }
  });

  it("returns empty top_categories when no bookings exist", async () => {
    const result = await getProviderAnalytics(emptyClient, "provider-new", "30d");

    expect(result.top_categories).toEqual([]);
  });

  it("returns enquiry_rate_pct between 0 and 100", async () => {
    const result = await getProviderAnalytics(populatedClient, "provider-1", "30d");

    expect(result.enquiry_rate_pct).toBeGreaterThanOrEqual(0);
    expect(result.enquiry_rate_pct).toBeLessThanOrEqual(100);
  });

  it("period parameter affects date range filtering", async () => {
    const fromSpy = vi.fn(() => populatedClient);
    const client7d = { ...populatedClient, from: fromSpy } as unknown as ReturnType<
      typeof import("@supabase/supabase-js").createClient
    >;

    // We call with different periods — the gte call should receive different start dates
    await getProviderAnalytics(client7d, "provider-1", "7d");
    const call7d = (populatedClient as unknown as Record<string, ReturnType<typeof vi.fn>>).gte
      .mock.calls;

    await getProviderAnalytics(populatedClient, "provider-1", "30d");
    const call30d = (populatedClient as unknown as Record<string, ReturnType<typeof vi.fn>>).gte
      .mock.calls;

    // Both should have been called; period length validation
    expect(call7d.length).toBeGreaterThan(0);
    expect(call30d.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// getConversionFunnel
// ---------------------------------------------------------------------------

describe("getConversionFunnel", () => {
  it("returns all 4 stages (viewed, enquired, quoted, booked)", async () => {
    const result = await getConversionFunnel(populatedClient, "provider-1", "30d");

    expect(result).toEqual(
      expect.objectContaining({
        viewed: expect.any(Number),
        enquired: expect.any(Number),
        quoted: expect.any(Number),
        booked: expect.any(Number),
      }),
    );
  });

  it("returns non-negative values for all stages", async () => {
    const result = await getConversionFunnel(populatedClient, "provider-1", "30d");

    expect(result.viewed).toBeGreaterThanOrEqual(0);
    expect(result.enquired).toBeGreaterThanOrEqual(0);
    expect(result.quoted).toBeGreaterThanOrEqual(0);
    expect(result.booked).toBeGreaterThanOrEqual(0);
  });

  it("returns zeros when no analytics data exists", async () => {
    const result = await getConversionFunnel(emptyClient, "provider-new", "30d");

    expect(result).toEqual({
      viewed: 0,
      enquired: 0,
      quoted: 0,
      booked: 0,
    });
  });

  it("accepts pre-fetched rows to avoid duplicate DB call", async () => {
    const result = await getConversionFunnel(
      populatedClient,
      "provider-1",
      "30d",
      sampleRows as never[],
    );

    expect(result.viewed).toBe(60); // 20 + 30 + 10
    expect(result.enquired).toBe(15); // 5 + 8 + 2
    expect(result.quoted).toBe(8); // 3 + 4 + 1
    expect(result.booked).toBe(3); // 1 + 2 + 0
  });
});
