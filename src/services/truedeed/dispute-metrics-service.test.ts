/**
 * Tests for truedeed dispute-metrics-service (TDD RED — service not yet implemented)
 *
 * Pins the contract of @/services/truedeed/dispute-metrics-service:
 *  getDisputeMetrics() → DisputeMetrics | null
 *
 * Where DisputeMetrics covers the "metrics that tell us the playbook is
 * working" section of docs/truedeed/dispute-playbook.md:
 *  - disputesPer100Invoices  (healthy < 8)
 *  - concessionRate          (0..1, 0-safe; healthy 0.10–0.25)
 *  - pctResolvedAtWindow     (rebuttals decided / (rebuttals + dispute decided))
 *  - repeatDisputers         (agents with ≥ 2 disputes, count desc)
 *  - chargebacks             (invoices.state = 'charged_back', healthy ≈ 0)
 *  - open / conceded / rejected counts
 *
 * Returns null only on top-level failure. All test data is synthetic.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { getDisputeMetrics } from "@/services/truedeed/dispute-metrics-service";

type DbResult = { data: unknown; error: unknown; count?: number | null };
const ok = (data: unknown = null, count?: number): DbResult => ({
  data,
  error: null,
  count: count ?? (Array.isArray(data) ? data.length : null),
});
const err = (error: unknown): DbResult => ({ data: null, error, count: null });

function createCountChain(result: DbResult) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: any = {};
  for (const method of ["eq", "in", "neq", "match", "is", "order", "limit"]) {
    chain[method] = vi.fn(() => chain);
  }
  // select() returns a thenable so `const { count } = await ...select(...)` works.
  chain.select = vi.fn(() => chain);
  chain.then = (
    onFulfilled?: (value: DbResult) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise.resolve(result).then(onFulfilled, onRejected);
  return chain;
}

function createSupabaseMock(opts: {
  invoicesCount?: number;
  chargebacksCount?: number;
  disputes?: Array<{ raised_by: string; status: string }>;
  rebuttalsDecidedCount?: number;
  invoicesError?: boolean;
  disputesError?: boolean;
}) {
  const invoicesAll = createCountChain(ok([], opts.invoicesCount ?? 0));
  const invoicesCharged = createCountChain(ok([], opts.chargebacksCount ?? 0));
  const disputes = createCountChain(
    opts.disputesError
      ? err({ message: "boom" })
      : ok(opts.disputes ?? []),
  );
  const rebuttals = createCountChain(ok([], opts.rebuttalsDecidedCount ?? 0));

  // Branch invoices.select by .eq(state,...) — first call (no eq) returns all
  // invoices count; .eq('state','charged_back') returns chargebacks count.
  const invoicesFactory = vi.fn(() => {
    let calls = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chain: any = {
      select: vi.fn(() => chain),
      eq: vi.fn((column: string, value: string) => {
        if (column === "state" && value === "charged_back") {
          calls = 1;
        }
        return chain;
      }),
      then: (
        onFulfilled?: (v: DbResult) => unknown,
        onRejected?: (r: unknown) => unknown,
      ) => {
        const target = calls === 1 ? invoicesCharged : invoicesAll;
        return Promise.resolve({
          data: null,
          error: opts.invoicesError ? { message: "boom" } : null,
          count: opts.invoicesError
            ? null
            : ((target as unknown as { _result?: DbResult })._result?.count ??
              (calls === 1
                ? opts.chargebacksCount ?? 0
                : opts.invoicesCount ?? 0)),
        } as DbResult).then(onFulfilled, onRejected);
      },
    };
    return chain;
  });

  const from = vi.fn((table: string) => {
    switch (table) {
      case "invoices":
        return invoicesFactory();
      case "invoice_disputes":
        return disputes;
      case "rebuttals":
        return rebuttals;
      default:
        return createCountChain(ok([], 0));
    }
  });

  return { supabase: { from } };
}

function arm(mock: ReturnType<typeof createSupabaseMock>) {
  vi.mocked(createAdminClient).mockReturnValue(mock.supabase as never);
  return mock;
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// 1. Happy path — full metric shape
// ---------------------------------------------------------------------------

describe("getDisputeMetrics — happy path", () => {
  it("computes every metric from the raw counts and dispute rows", async () => {
    arm(
      createSupabaseMock({
        invoicesCount: 200,
        chargebacksCount: 1,
        disputes: [
          { raised_by: "agent-A", status: "conceded" },
          { raised_by: "agent-A", status: "open" },
          { raised_by: "agent-A", status: "rejected" },
          { raised_by: "agent-B", status: "rejected" },
          { raised_by: "agent-B", status: "open" },
          { raised_by: "agent-C", status: "conceded" },
          { raised_by: "agent-D", status: "open" },
          { raised_by: "agent-E", status: "rejected" },
        ],
        rebuttalsDecidedCount: 12,
      }),
    );

    const metrics = await getDisputeMetrics();

    expect(metrics).not.toBeNull();
    expect(metrics!.open).toBe(3);
    expect(metrics!.conceded).toBe(2);
    expect(metrics!.rejected).toBe(3);
    expect(metrics!.chargebacks).toBe(1);

    // 8 disputes / 200 invoices * 100 = 4
    expect(metrics!.disputesPer100Invoices).toBeCloseTo(4, 6);

    // concessionRate = conceded / decided = 2 / 5 = 0.4
    expect(metrics!.concessionRate).toBeCloseTo(0.4, 6);

    // pctResolvedAtWindow = rebuttals decided / (rebuttals decided + dispute decided)
    // = 12 / (12 + 5) = 0.7058823529...
    expect(metrics!.pctResolvedAtWindow).toBeCloseTo(12 / 17, 4);

    // Repeat-disputers: A=3, B=2 (descending). C/D/E (each 1) excluded.
    expect(metrics!.repeatDisputers).toEqual([
      { agentId: "agent-A", count: 3 },
      { agentId: "agent-B", count: 2 },
    ]);
  });
});

// ---------------------------------------------------------------------------
// 2. Zero-division safety
// ---------------------------------------------------------------------------

describe("getDisputeMetrics — zero-division safety", () => {
  it("returns 0 for every ratio when there are no invoices, no disputes, no rebuttals", async () => {
    arm(
      createSupabaseMock({
        invoicesCount: 0,
        chargebacksCount: 0,
        disputes: [],
        rebuttalsDecidedCount: 0,
      }),
    );

    const metrics = await getDisputeMetrics();

    expect(metrics).not.toBeNull();
    expect(metrics!.disputesPer100Invoices).toBe(0);
    expect(metrics!.concessionRate).toBe(0);
    expect(metrics!.pctResolvedAtWindow).toBe(0);
    expect(metrics!.repeatDisputers).toEqual([]);
    expect(metrics!.open).toBe(0);
    expect(metrics!.conceded).toBe(0);
    expect(metrics!.rejected).toBe(0);
    expect(metrics!.chargebacks).toBe(0);
  });

  it("returns 0 concessionRate when no disputes are decided yet (all open)", async () => {
    arm(
      createSupabaseMock({
        invoicesCount: 10,
        disputes: [
          { raised_by: "agent-A", status: "open" },
          { raised_by: "agent-B", status: "open" },
        ],
      }),
    );

    const metrics = await getDisputeMetrics();
    expect(metrics!.concessionRate).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 3. Repeat-disputer ordering and threshold
// ---------------------------------------------------------------------------

describe("getDisputeMetrics — repeat-disputer concentration", () => {
  it("excludes single-dispute agents and orders ≥ 2 disputes descending", async () => {
    arm(
      createSupabaseMock({
        invoicesCount: 50,
        disputes: [
          { raised_by: "low-volume", status: "rejected" },
          { raised_by: "small-time", status: "rejected" },
          { raised_by: "frequent", status: "rejected" },
          { raised_by: "frequent", status: "rejected" },
          { raised_by: "headline-grabber", status: "open" },
          { raised_by: "headline-grabber", status: "rejected" },
          { raised_by: "headline-grabber", status: "open" },
        ],
      }),
    );

    const metrics = await getDisputeMetrics();
    expect(metrics!.repeatDisputers).toEqual([
      { agentId: "headline-grabber", count: 3 },
      { agentId: "frequent", count: 2 },
    ]);
  });
});

// ---------------------------------------------------------------------------
// 4. Failure path
// ---------------------------------------------------------------------------

describe("getDisputeMetrics — failure path", () => {
  it("returns null when the dispute query errors", async () => {
    arm(
      createSupabaseMock({
        invoicesCount: 10,
        disputesError: true,
      }),
    );

    const metrics = await getDisputeMetrics();
    expect(metrics).toBeNull();
  });

  it("returns null when the invoice count query errors", async () => {
    arm(
      createSupabaseMock({
        invoicesError: true,
        disputes: [],
      }),
    );

    const metrics = await getDisputeMetrics();
    expect(metrics).toBeNull();
  });
});
