import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  MIN_RESOLVED_REPORTS,
  MIN_UPTIME_PROBES,
  buildMedianResolutionHours,
  buildSeries,
  buildUptime,
  computeDailyMetrics,
  upsertDailyMetrics,
  utcDay,
} from "./platform-metrics-service";

// ---------------------------------------------------------------------------
// buildUptime — the >= MIN_UPTIME_PROBES (100) gate, boundary-exact
// ---------------------------------------------------------------------------

describe("buildUptime", () => {
  it("gates at 99 probes (availabilityPct stays null)", () => {
    const result = buildUptime(99, 99);
    expect(result.availabilityPct).toBeNull();
    expect(result.probeCount).toBe(99);
  });

  it("publishes at exactly 100 probes", () => {
    const result = buildUptime(99, 100);
    expect(result.availabilityPct).toBe(99);
  });

  it("publishes at 101 probes with 2dp rounding", () => {
    const result = buildUptime(100, 101);
    expect(result.availabilityPct).toBe(99.01);
  });

  it("uses the disclosed MIN_UPTIME_PROBES constant", () => {
    expect(MIN_UPTIME_PROBES).toBe(100);
    expect(buildUptime(0, 0).availabilityPct).toBeNull();
  });

  it("reports 100% when every probe succeeded", () => {
    expect(buildUptime(200, 200).availabilityPct).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// buildSeries — missing days become null GAPS, never zeros
// ---------------------------------------------------------------------------

describe("buildSeries", () => {
  it("fills missing days as null gaps, not zeros", () => {
    const series = buildSeries(
      [
        { day: "2026-06-30", value: 5 },
        { day: "2026-07-02", value: 7 },
      ],
      { days: 4, end: "2026-07-02" },
    );

    expect(series).toEqual([
      { day: "2026-06-29", value: null },
      { day: "2026-06-30", value: 5 },
      { day: "2026-07-01", value: null },
      { day: "2026-07-02", value: 7 },
    ]);
  });

  it("keeps a recorded 0 as 0 (distinct from a gap)", () => {
    const series = buildSeries([{ day: "2026-07-02", value: 0 }], {
      days: 2,
      end: "2026-07-02",
    });
    expect(series[1]).toEqual({ day: "2026-07-02", value: 0 });
    expect(series[0].value).toBeNull();
  });

  it("defaults to a 30-day window ending today (UTC)", () => {
    const series = buildSeries([]);
    expect(series).toHaveLength(30);
    expect(series[29].day).toBe(utcDay());
  });
});

// ---------------------------------------------------------------------------
// buildMedianResolutionHours — the >= MIN_RESOLVED_REPORTS (10) gate
// ---------------------------------------------------------------------------

function resolvedRow(hours: number): { created_at: string; resolved_at: string } {
  const created = new Date("2026-06-01T00:00:00Z");
  return {
    created_at: created.toISOString(),
    resolved_at: new Date(created.getTime() + hours * 60 * 60 * 1000).toISOString(),
  };
}

describe("buildMedianResolutionHours", () => {
  it("returns null below the disclosed threshold", () => {
    const rows = Array.from({ length: MIN_RESOLVED_REPORTS - 1 }, () => resolvedRow(4));
    expect(buildMedianResolutionHours(rows)).toBeNull();
  });

  it("returns the median at exactly the threshold", () => {
    const rows = Array.from({ length: MIN_RESOLVED_REPORTS }, (_, i) => resolvedRow(i + 1));
    // 1..10 hours → median 5.5
    expect(buildMedianResolutionHours(rows)).toBe(5.5);
  });

  it("ignores unresolved and negative-duration rows", () => {
    const rows = [
      ...Array.from({ length: MIN_RESOLVED_REPORTS }, () => resolvedRow(2)),
      { created_at: "2026-06-01T00:00:00Z", resolved_at: null },
      { created_at: "2026-06-02T00:00:00Z", resolved_at: "2026-06-01T00:00:00Z" },
    ];
    expect(buildMedianResolutionHours(rows)).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// computeDailyMetrics — per-metric error → OMIT (never a fabricated 0)
// ---------------------------------------------------------------------------

type QueryResult = {
  count?: number | null;
  data?: unknown;
  error: { message: string } | null;
};

type QueryCall = { method: string; args: unknown[] };

/**
 * Minimal PostgREST builder mock: chainable, thenable, resolved per-query by
 * inspecting the table and recorded filter calls.
 */
function makeAdmin(resolve: (table: string, calls: QueryCall[]) => QueryResult): SupabaseClient {
  const from = (table: string) => {
    const calls: QueryCall[] = [];
    const builder: Record<string, unknown> = {};
    for (const method of ["select", "eq", "is", "gte", "in", "order", "limit"]) {
      builder[method] = (...args: unknown[]) => {
        calls.push({ method, args });
        return builder;
      };
    }
    builder.then = (
      onFulfilled: (value: QueryResult) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(resolve(table, calls)).then(onFulfilled, onRejected);
    return builder;
  };
  return { from } as unknown as SupabaseClient;
}

function isCountQuery(calls: QueryCall[]): boolean {
  return calls.some((c) => c.method === "select" && (c.args[1] as { head?: boolean })?.head === true);
}

function hasFilter(calls: QueryCall[], method: string, column: string, value?: unknown): boolean {
  return calls.some(
    (c) => c.method === method && c.args[0] === column && (value === undefined || c.args[1] === value),
  );
}

describe("computeDailyMetrics", () => {
  it("computes every reliable metric and never fabricates values", async () => {
    const admin = makeAdmin((table, calls) => {
      if (table === "listings" && hasFilter(calls, "eq", "listing_type", "sale"))
        return { count: 12, error: null };
      if (table === "listings" && hasFilter(calls, "eq", "listing_type", "rent"))
        return { count: 3, error: null };
      if (table === "profiles") return { count: 250, error: null };
      if (table === "messages") return { count: 40, error: null };
      if (table === "valuation_sessions") return { count: 9, error: null };
      if (table === "content_reports" && hasFilter(calls, "eq", "status", "open"))
        return { count: 2, error: null };
      if (table === "content_reports" && isCountQuery(calls)) return { count: 1, error: null };
      // resolved-reports meta rows (below the median threshold → null median)
      return { data: [resolvedRow(3)], error: null };
    });

    const rows = await computeDailyMetrics(admin);

    expect(rows).toEqual([
      { metric: "active_sale_listings", value: 12 },
      { metric: "active_rent_listings", value: 3 },
      { metric: "registered_users", value: 250 },
      { metric: "messages_30d", value: 40 },
      { metric: "valuations_generated", value: 9 },
      { metric: "content_reports_open", value: 2 },
      {
        metric: "content_reports_resolved",
        value: 1,
        meta: { resolved_sample_n: 1, median_resolution_hours: null },
      },
    ]);
  });

  it("omits a metric whose query fails — 0 rows and failed query stay distinct", async () => {
    const admin = makeAdmin((table, calls) => {
      if (table === "listings" && hasFilter(calls, "eq", "listing_type", "sale"))
        return { count: null, error: { message: "boom" } };
      if (isCountQuery(calls)) return { count: 0, error: null };
      return { data: [], error: null };
    });

    const rows = await computeDailyMetrics(admin);
    const keys = rows.map((r) => r.metric);

    expect(keys).not.toContain("active_sale_listings");
    // A genuine zero IS published.
    expect(rows).toContainEqual({ metric: "active_rent_listings", value: 0 });
    expect(keys).toHaveLength(6);
  });

  it("publishes the resolution median once the threshold clears", async () => {
    const admin = makeAdmin((table, calls) => {
      if (table === "content_reports" && !isCountQuery(calls)) {
        return {
          data: Array.from({ length: MIN_RESOLVED_REPORTS }, () => resolvedRow(6)),
          error: null,
        };
      }
      return { count: 20, error: null };
    });

    const rows = await computeDailyMetrics(admin);
    const resolved = rows.find((r) => r.metric === "content_reports_resolved");
    expect(resolved?.meta).toEqual({
      resolved_sample_n: MIN_RESOLVED_REPORTS,
      median_resolution_hours: 6,
    });
  });
});

// ---------------------------------------------------------------------------
// upsertDailyMetrics
// ---------------------------------------------------------------------------

describe("upsertDailyMetrics", () => {
  it("upserts on the (metric, day) primary key", async () => {
    const upsert = vi.fn(async () => ({ error: null }));
    const admin = { from: vi.fn(() => ({ upsert })) } as unknown as SupabaseClient;

    await upsertDailyMetrics(admin, "2026-07-02", [
      { metric: "registered_users", value: 250 },
      { metric: "content_reports_resolved", value: 1, meta: { resolved_sample_n: 1 } },
    ]);

    expect(upsert).toHaveBeenCalledWith(
      [
        { metric: "registered_users", day: "2026-07-02", value: 250, meta: {} },
        {
          metric: "content_reports_resolved",
          day: "2026-07-02",
          value: 1,
          meta: { resolved_sample_n: 1 },
        },
      ],
      { onConflict: "metric,day" },
    );
  });

  it("throws so the job retries when the upsert fails", async () => {
    const upsert = vi.fn(async () => ({ error: { message: "denied" } }));
    const admin = { from: vi.fn(() => ({ upsert })) } as unknown as SupabaseClient;

    await expect(
      upsertDailyMetrics(admin, "2026-07-02", [{ metric: "registered_users", value: 1 }]),
    ).rejects.toThrow(/upsert failed/);
  });

  it("does nothing when every metric was omitted", async () => {
    const from = vi.fn();
    const admin = { from } as unknown as SupabaseClient;
    await upsertDailyMetrics(admin, "2026-07-02", []);
    expect(from).not.toHaveBeenCalled();
  });
});
