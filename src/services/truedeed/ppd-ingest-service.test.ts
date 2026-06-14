/**
 * Tests for truedeed ppd-ingest-service (TDD RED — service not yet implemented)
 *
 * Pins the contract of @/services/truedeed/ppd-ingest-service per
 * docs/truedeed/attribution-tracking-spec.md §4.1–§4.2 (`ppd:ingest` job):
 *
 *  1. applyPpdRows(rows: ParsedPpdRow[], ingestRunId: string)
 *     → { added: number; changed: number; deleted: number } | null
 *     - Partitions by recordStatus (PPD is a *revisable* dataset):
 *         A/C → upsert into ppd_transactions with onConflict 'ppd_tuid'
 *               (payload mapping pinned: ppd_tuid, price_pence, transfer_date,
 *                postcode, last_record_status, ingest_run_id)
 *         D   → delete from ppd_transactions by ppd_tuid (.in)
 *     - Upserts are batched in chunks of 500 (1200 A-rows → 3 upsert calls)
 *     - Returns counts; ANY supabase error → null (never throws)
 *  2. startIngestRun(fileLabel, fileSha256) → inserts ppd_ingest_runs
 *     (file_label, file_sha256) returning the new run id; null on error.
 *  3. finishIngestRun(id, counts, status) → updates the run row with
 *     status + rows_added/rows_changed/rows_deleted, matched by id.
 *
 * All test data is synthetic.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/inngest/client", () => ({
  inngest: { send: vi.fn().mockResolvedValue(undefined) },
}));

import { createAdminClient } from "@/lib/supabase/admin";
import type { ParsedPpdRow } from "@/lib/truedeed/ppd-parser";
import {
  applyPpdRows,
  startIngestRun,
  finishIngestRun,
} from "@/services/truedeed/ppd-ingest-service";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const RUN_ID = "aaaaaaaa-0000-4000-8000-000000000001";
const TUID_A = "8A4F1D2E-3B5C-4F6A-9E8D-7C1B2A3F4E5D";
const TUID_C = "1B2C3D4E-5F6A-4B7C-8D9E-0F1A2B3C4D5E";
const TUID_D = "9F8E7D6C-5B4A-4392-8170-FEDCBA987654";
const FILE_LABEL = "pp-monthly-update-2026-06.csv";
const FILE_SHA256 =
  "c0ffee00c0ffee00c0ffee00c0ffee00c0ffee00c0ffee00c0ffee00c0ffee00";

const NOW = new Date("2026-06-12T10:00:00.000Z");

const makeRow = (overrides: Partial<ParsedPpdRow> = {}): ParsedPpdRow => ({
  tuid: TUID_A,
  pricePence: 25000000, // £250,000
  transferDate: "2026-03-14",
  postcode: "SW1A 1AA",
  propertyType: "T",
  newBuild: false,
  tenure: "F",
  paon: "12",
  saon: null,
  street: "DOWNING STREET",
  locality: null,
  town: "LONDON",
  district: "CITY OF WESTMINSTER",
  county: "GREATER LONDON",
  ppdCategory: "A",
  recordStatus: "A",
  ...overrides,
});

type DbResult = { data: unknown; error: unknown };
const ok = (data: unknown = null): DbResult => ({ data, error: null });
const err = (message: string): DbResult => ({
  data: null,
  error: { message },
});

/**
 * Chainable per-table mock (pattern from outcome-service.test.ts).
 * Each op result may be a single DbResult or a queue (array) consumed
 * call-by-call; the last queue entry repeats.
 */
type OpResults = Partial<
  Record<
    "insert" | "upsert" | "update" | "delete" | "select",
    DbResult | DbResult[]
  >
>;

function createTableChain(results: OpResults) {
  let op: keyof OpResults = "select";
  const resolveResult = (): DbResult => {
    const r = results[op];
    if (Array.isArray(r)) return (r.length > 1 ? r.shift() : r[0]) ?? ok();
    return r ?? ok();
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: any = {};
  for (const method of ["eq", "match", "order", "limit", "is", "in"]) {
    chain[method] = vi.fn(() => chain);
  }
  for (const method of ["insert", "upsert", "update", "delete"] as const) {
    chain[method] = vi.fn(() => {
      op = method;
      return chain;
    });
  }
  chain.select = vi.fn(() => {
    if (op === "select") op = "select";
    return chain;
  });
  chain.single = vi.fn(() => Promise.resolve(resolveResult()));
  chain.maybeSingle = vi.fn(() => Promise.resolve(resolveResult()));
  chain.then = (
    onFulfilled?: (value: DbResult) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise.resolve(resolveResult()).then(onFulfilled, onRejected);
  return chain;
}

function createSupabaseMock(overrides?: {
  transactionsUpsert?: DbResult | DbResult[];
  transactionsDelete?: DbResult;
  ingestRunInsert?: DbResult;
  ingestRunUpdate?: DbResult;
}) {
  const transactions = createTableChain({
    upsert: overrides?.transactionsUpsert ?? ok(),
    delete: overrides?.transactionsDelete ?? ok(),
  });
  const ingestRuns = createTableChain({
    insert: overrides?.ingestRunInsert ?? ok({ id: RUN_ID }),
    update: overrides?.ingestRunUpdate ?? ok(),
  });

  const from = vi.fn((table: string) => {
    switch (table) {
      case "ppd_transactions":
        return transactions;
      case "ppd_ingest_runs":
        return ingestRuns;
      default:
        return createTableChain({});
    }
  });

  const supabase = { from, rpc: vi.fn().mockResolvedValue(ok()) };
  return { supabase, from, transactions, ingestRuns };
}

function arm(mock: ReturnType<typeof createSupabaseMock>) {
  vi.mocked(createAdminClient).mockReturnValue(mock.supabase as never);
  return mock;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ["Date"], now: NOW });
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// 1. applyPpdRows — A/C/D partitioning
// ---------------------------------------------------------------------------

describe("applyPpdRows — A/C/D partitioning", () => {
  const MIXED_ROWS: ParsedPpdRow[] = [
    makeRow({ tuid: TUID_A, recordStatus: "A" }),
    makeRow({ tuid: TUID_C, recordStatus: "C", pricePence: 30000000 }),
    makeRow({ tuid: TUID_D, recordStatus: "D" }),
  ];

  it("upserts A and C rows into ppd_transactions with onConflict 'ppd_tuid'", async () => {
    // Arrange
    const { transactions } = arm(createSupabaseMock());

    // Act
    await applyPpdRows(MIXED_ROWS, RUN_ID);

    // Assert — one batch containing both the A and the C row
    expect(transactions.upsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ ppd_tuid: TUID_A }),
        expect.objectContaining({ ppd_tuid: TUID_C }),
      ]),
      expect.objectContaining({ onConflict: "ppd_tuid" }),
    );
  });

  it("pins the upsert payload mapping: price_pence, transfer_date, postcode, last_record_status, ingest_run_id", async () => {
    // Arrange
    const { transactions } = arm(createSupabaseMock());

    // Act
    await applyPpdRows([makeRow({ recordStatus: "A" })], RUN_ID);

    // Assert
    expect(transactions.upsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          ppd_tuid: TUID_A,
          price_pence: 25000000,
          transfer_date: "2026-03-14",
          postcode: "SW1A 1AA",
          last_record_status: "A",
          ingest_run_id: RUN_ID,
        }),
      ]),
      expect.anything(),
    );
  });

  it("records last_record_status 'C' for changed rows", async () => {
    // Arrange
    const { transactions } = arm(createSupabaseMock());

    // Act
    await applyPpdRows([makeRow({ tuid: TUID_C, recordStatus: "C" })], RUN_ID);

    // Assert
    expect(transactions.upsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ ppd_tuid: TUID_C, last_record_status: "C" }),
      ]),
      expect.anything(),
    );
  });

  it("deletes D rows by ppd_tuid (.in) and never includes them in the upsert", async () => {
    // Arrange
    const { transactions } = arm(createSupabaseMock());

    // Act
    await applyPpdRows(MIXED_ROWS, RUN_ID);

    // Assert — delete path
    expect(transactions.delete).toHaveBeenCalled();
    expect(transactions.in).toHaveBeenCalledWith(
      "ppd_tuid",
      expect.arrayContaining([TUID_D]),
    );
    // ...and the D tuid appears in no upsert batch
    const upserted = transactions.upsert.mock.calls.flatMap(
      (c: unknown[]) => c[0] as Array<{ ppd_tuid: string }>,
    );
    expect(upserted.some((p) => p.ppd_tuid === TUID_D)).toBe(false);
  });

  it("returns { added, changed, deleted } counts for a mixed batch", async () => {
    // Arrange
    arm(createSupabaseMock());
    const rows = [
      makeRow({ tuid: "T-A1", recordStatus: "A" }),
      makeRow({ tuid: "T-A2", recordStatus: "A" }),
      makeRow({ tuid: "T-A3", recordStatus: "A" }),
      makeRow({ tuid: "T-C1", recordStatus: "C" }),
      makeRow({ tuid: "T-C2", recordStatus: "C" }),
      makeRow({ tuid: "T-D1", recordStatus: "D" }),
    ];

    // Act
    const result = await applyPpdRows(rows, RUN_ID);

    // Assert
    expect(result).toEqual({ added: 3, changed: 2, deleted: 1 });
  });

  it("returns zero counts and touches the database not at all for an empty batch", async () => {
    // Arrange
    const { transactions } = arm(createSupabaseMock());

    // Act
    const result = await applyPpdRows([], RUN_ID);

    // Assert
    expect(result).toEqual({ added: 0, changed: 0, deleted: 0 });
    expect(transactions.upsert).not.toHaveBeenCalled();
    expect(transactions.delete).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 2. applyPpdRows — batching
// ---------------------------------------------------------------------------

describe("applyPpdRows — batching", () => {
  it("chunks upserts in batches of 500: 1200 A-rows → 3 upsert calls of 500/500/200", async () => {
    // Arrange
    const { transactions } = arm(createSupabaseMock());
    const rows = Array.from({ length: 1200 }, (_, i) =>
      makeRow({ tuid: `BATCH-TUID-${i}`, recordStatus: "A" }),
    );

    // Act
    const result = await applyPpdRows(rows, RUN_ID);

    // Assert
    expect(transactions.upsert).toHaveBeenCalledTimes(3);
    expect(
      transactions.upsert.mock.calls.map((c: unknown[]) =>
        (c[0] as unknown[]).length,
      ),
    ).toEqual([500, 500, 200]);
    expect(result).toEqual({ added: 1200, changed: 0, deleted: 0 });
  });
});

// ---------------------------------------------------------------------------
// 3. applyPpdRows — error handling (never throws)
// ---------------------------------------------------------------------------

describe("applyPpdRows — error handling", () => {
  it("returns null when the upsert reports an error", async () => {
    // Arrange
    arm(
      createSupabaseMock({
        transactionsUpsert: err("permission denied for table ppd_transactions"),
      }),
    );

    // Act + Assert
    await expect(
      applyPpdRows([makeRow({ recordStatus: "A" })], RUN_ID),
    ).resolves.toBeNull();
  });

  it("returns null when the delete reports an error", async () => {
    // Arrange
    arm(createSupabaseMock({ transactionsDelete: err("deadlock detected") }));

    // Act + Assert
    await expect(
      applyPpdRows([makeRow({ tuid: TUID_D, recordStatus: "D" })], RUN_ID),
    ).resolves.toBeNull();
  });

  it("resolves null (never throws) when supabase throws", async () => {
    // Arrange
    const mock = arm(createSupabaseMock());
    mock.from.mockImplementation(() => {
      throw new Error("connection reset");
    });

    // Act + Assert
    await expect(
      applyPpdRows([makeRow({ recordStatus: "A" })], RUN_ID),
    ).resolves.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 4. startIngestRun / finishIngestRun
// ---------------------------------------------------------------------------

describe("startIngestRun", () => {
  it("inserts a ppd_ingest_runs row with file_label + file_sha256 and returns the new id", async () => {
    // Arrange
    const { ingestRuns } = arm(createSupabaseMock());

    // Act
    const runId = await startIngestRun(FILE_LABEL, FILE_SHA256);

    // Assert
    expect(ingestRuns.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        file_label: FILE_LABEL,
        file_sha256: FILE_SHA256,
      }),
    );
    expect(runId).toBe(RUN_ID);
  });

  it("returns null when the insert reports an error", async () => {
    // Arrange
    arm(
      createSupabaseMock({
        ingestRunInsert: err('relation "ppd_ingest_runs" does not exist'),
      }),
    );

    // Act + Assert
    await expect(startIngestRun(FILE_LABEL, FILE_SHA256)).resolves.toBeNull();
  });
});

describe("finishIngestRun", () => {
  it("updates the run row (matched by id) with status and rows_added/rows_changed/rows_deleted", async () => {
    // Arrange
    const { ingestRuns } = arm(createSupabaseMock());

    // Act
    await finishIngestRun(
      RUN_ID,
      { added: 3, changed: 2, deleted: 1 },
      "succeeded",
    );

    // Assert
    expect(ingestRuns.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "succeeded",
        rows_added: 3,
        rows_changed: 2,
        rows_deleted: 1,
      }),
    );
    expect(ingestRuns.eq).toHaveBeenCalledWith("id", RUN_ID);
  });
});
