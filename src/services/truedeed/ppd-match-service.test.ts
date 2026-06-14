/**
 * Tests for truedeed ppd-match-service (TDD RED — service not yet implemented)
 *
 * Pins the contract of @/services/truedeed/ppd-match-service per
 * docs/truedeed/attribution-tracking-spec.md §4.2–§4.4 (`ppd:match` job):
 *
 *  processMatchesForPpdRows(rows: ParsedPpdRow[])
 *    → { created: number; queried: number } | null
 *    created = ppd_match_candidates rows inserted
 *    queried = audit-mode branch queries raised (status 'branch_queried')
 *
 *  - Postcode gate: rows without a postcode are skipped entirely (no listings
 *    query, no scoring). For each row with a postcode the service queries
 *    listings by NORMALISED postcode (eq) with the embedded introduction (and
 *    its reported outcomes); window filtering may happen in JS — we pin
 *    observable behaviour, not SQL.
 *  - Scoring delegates to @/lib/truedeed/ppd-matcher's scoreMatch, and the
 *    branch thresholds MUST come from the module's exported constants
 *    (VERIFICATION_AUTO_CONFIRM / AUDIT_QUERY / WATCHLIST) — pinned here by
 *    mocking them to NON-SPEC values (0.9 / 0.7 / 0.55) so hardcoded spec
 *    numbers (0.80 / 0.65 / 0.50) fail.
 *  - Verification mode (a 'completed' reported outcome exists):
 *      score >= VERIFICATION_AUTO_CONFIRM → { mode: 'verification', status: 'confirmed' }
 *      score <  threshold                 → { mode: 'verification', status: 'pending_review' }
 *  - Audit mode (no completed outcome — §4.4: a query, NEVER an invoice):
 *      score >= AUDIT_QUERY → candidate { mode: 'audit', status: 'branch_queried' }
 *                             + invoice_candidates { source: 'audit_match',
 *                               status: 'on_hold_branch_query', ppd_match_id,
 *                               hold_expires_at: future ISO timestamp }
 *                             + inngest 'truedeed/audit-query.raised'
 *                               { matchId, introductionId, listingId }
 *      [WATCHLIST, AUDIT_QUERY) → candidate { mode: 'audit', status: 'pending_review' }
 *                                 ONLY (no invoice candidate, no event)
 *      < WATCHLIST → nothing
 *  - Duplicate ppd_tuid+listing_id (23505) → skipped silently, counted in
 *    neither. Per-row errors skip the row without aborting the batch;
 *    only top-level failures return null (never throws).
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

// Thresholds deliberately differ from the spec values (0.80/0.65/0.50) so a
// service that hardcodes the spec numbers — instead of importing the real
// constants — fails these tests.
vi.mock("@/lib/truedeed/ppd-matcher", () => ({
  scoreMatch: vi.fn(),
  normalisePostcode: vi.fn((value: string) =>
    value.trim().toUpperCase().replace(/\s+/g, " "),
  ),
  VERIFICATION_AUTO_CONFIRM: 0.9,
  AUDIT_QUERY: 0.7,
  WATCHLIST: 0.55,
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { inngest } from "@/inngest/client";
import { scoreMatch } from "@/lib/truedeed/ppd-matcher";
import type { ParsedPpdRow } from "@/lib/truedeed/ppd-parser";
import { processMatchesForPpdRows } from "@/services/truedeed/ppd-match-service";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const LISTING_ID = "bbbbbbbb-0000-4000-8000-000000000002";
const INTRO_ID = "eeeeeeee-0000-4000-8000-000000000005";
const OUTCOME_ID = "55555555-0000-4000-8000-00000000000c";
const MATCH_ID = "66666666-0000-4000-8000-00000000000e";
const TUID = "8A4F1D2E-3B5C-4F6A-9E8D-7C1B2A3F4E5D";

const NOW = new Date("2026-06-12T10:00:00.000Z");

const makeRow = (overrides: Partial<ParsedPpdRow> = {}): ParsedPpdRow => ({
  tuid: TUID,
  pricePence: 22000000,
  transferDate: "2026-04-15",
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

/** A listing whose embedded introduction window fits the transfer date. */
const makeListingRow = (opts: { completedOutcome: boolean }) => ({
  id: LISTING_ID,
  postcode: "SW1A 1AA",
  paon: "12",
  saon: null,
  street: "DOWNING STREET",
  property_type: "terraced",
  asking_price_pence: 22000000,
  introductions: [
    {
      id: INTRO_ID,
      occurred_at: "2026-01-01T00:00:00.000Z",
      tail_expires_at: "2026-09-01T00:00:00.000Z",
      status: "active",
      reported_outcomes: opts.completedOutcome
        ? [{ id: OUTCOME_ID, outcome: "completed" }]
        : [],
    },
  ],
});

const AUDIT_LISTING = makeListingRow({ completedOutcome: false });
const VERIFICATION_LISTING = makeListingRow({ completedOutcome: true });

type DbResult = { data: unknown; error: unknown };
const ok = (data: unknown = null): DbResult => ({ data, error: null });
const err = (message: string): DbResult => ({ data: null, error: { message } });

/**
 * Chainable per-table mock (pattern from outcome-service.test.ts). Op results
 * may be a single DbResult or a queue (array) consumed call-by-call; the last
 * queue entry repeats.
 */
type OpResults = Partial<
  Record<"insert" | "select", DbResult | DbResult[]>
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
  for (const method of ["eq", "match", "order", "limit", "is", "in", "gte", "lte"]) {
    chain[method] = vi.fn(() => chain);
  }
  chain.insert = vi.fn(() => {
    op = "insert";
    return chain;
  });
  chain.select = vi.fn(() => {
    if (op !== "insert") op = "select";
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
  listingsSelect?: DbResult | DbResult[];
  matchInsert?: DbResult | DbResult[];
  invoiceInsert?: DbResult;
}) {
  const listings = createTableChain({
    select: overrides?.listingsSelect ?? ok([AUDIT_LISTING]),
  });
  const matchCandidates = createTableChain({
    insert: overrides?.matchInsert ?? ok({ id: MATCH_ID }),
  });
  const invoiceCandidates = createTableChain({
    insert: overrides?.invoiceInsert ?? ok(),
  });

  const from = vi.fn((table: string) => {
    switch (table) {
      case "listings":
        return listings;
      case "ppd_match_candidates":
        return matchCandidates;
      case "invoice_candidates":
        return invoiceCandidates;
      default:
        return createTableChain({});
    }
  });

  const supabase = { from, rpc: vi.fn().mockResolvedValue(ok()) };
  return { supabase, from, listings, matchCandidates, invoiceCandidates };
}

function arm(mock: ReturnType<typeof createSupabaseMock>) {
  vi.mocked(createAdminClient).mockReturnValue(mock.supabase as never);
  return mock;
}

const armScore = (score: number) =>
  vi
    .mocked(scoreMatch)
    .mockReturnValue({ score, capped: false, components: {} } as never);

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ["Date"], now: NOW });
  vi.mocked(inngest.send).mockResolvedValue(undefined as never);
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// 1. Postcode gate & listings query
// ---------------------------------------------------------------------------

describe("processMatchesForPpdRows — postcode gate & listings query", () => {
  it("skips rows without a postcode entirely: no listings query, no scoring, zero counts", async () => {
    // Arrange
    const { listings } = arm(createSupabaseMock());

    // Act
    const result = await processMatchesForPpdRows([
      makeRow({ postcode: null }),
    ]);

    // Assert
    expect(result).toEqual({ created: 0, queried: 0 });
    expect(listings.select).not.toHaveBeenCalled();
    expect(scoreMatch).not.toHaveBeenCalled();
  });

  it("queries listings (select) filtered by the NORMALISED postcode and scores each candidate via scoreMatch", async () => {
    // Arrange
    const { from, listings } = arm(createSupabaseMock());
    armScore(0.95);

    // Act — messy postcode normalises to 'SW1A 1AA'
    await processMatchesForPpdRows([makeRow({ postcode: " sw1a  1aa " })]);

    // Assert
    expect(from).toHaveBeenCalledWith("listings");
    expect(listings.select).toHaveBeenCalled();
    expect(listings.eq).toHaveBeenCalledWith(
      expect.stringContaining("postcode"),
      "SW1A 1AA",
    );
    expect(scoreMatch).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// 2. Verification mode (a 'completed' reported outcome exists)
// ---------------------------------------------------------------------------

describe("processMatchesForPpdRows — verification mode", () => {
  it("score >= VERIFICATION_AUTO_CONFIRM → inserts { mode: 'verification', status: 'confirmed' }; no invoice, no event", async () => {
    // Arrange
    const { matchCandidates, invoiceCandidates } = arm(
      createSupabaseMock({ listingsSelect: ok([VERIFICATION_LISTING]) }),
    );
    armScore(0.95); // >= mocked 0.9

    // Act
    const result = await processMatchesForPpdRows([makeRow()]);

    // Assert
    expect(matchCandidates.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "verification",
        status: "confirmed",
      }),
    );
    expect(invoiceCandidates.insert).not.toHaveBeenCalled();
    expect(inngest.send).not.toHaveBeenCalled();
    expect(result).toEqual({ created: 1, queried: 0 });
  });

  it("score below the CONSTANT (0.85 < mocked 0.9, though >= the spec's 0.80) → { mode: 'verification', status: 'pending_review' } for ops", async () => {
    // Arrange — pins that the service reads VERIFICATION_AUTO_CONFIRM rather
    // than hardcoding 0.80: a hardcoded service would auto-confirm 0.85.
    const { matchCandidates, invoiceCandidates } = arm(
      createSupabaseMock({ listingsSelect: ok([VERIFICATION_LISTING]) }),
    );
    armScore(0.85);

    // Act
    const result = await processMatchesForPpdRows([makeRow()]);

    // Assert
    expect(matchCandidates.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "verification",
        status: "pending_review",
      }),
    );
    expect(invoiceCandidates.insert).not.toHaveBeenCalled();
    expect(result).toEqual({ created: 1, queried: 0 });
  });
});

// ---------------------------------------------------------------------------
// 3. Audit mode (no completed outcome) — a query, never an invoice
// ---------------------------------------------------------------------------

describe("processMatchesForPpdRows — audit mode", () => {
  it("score >= AUDIT_QUERY → inserts candidate { mode: 'audit', status: 'branch_queried' } keyed by ppd_tuid + listing_id", async () => {
    // Arrange
    const { matchCandidates } = arm(createSupabaseMock());
    armScore(0.75); // >= mocked 0.7

    // Act
    const result = await processMatchesForPpdRows([makeRow()]);

    // Assert
    expect(matchCandidates.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        ppd_tuid: TUID,
        listing_id: LISTING_ID,
        mode: "audit",
        status: "branch_queried",
      }),
    );
    expect(result).toEqual({ created: 1, queried: 1 });
  });

  it("...and inserts invoice_candidates { source: 'audit_match', status: 'on_hold_branch_query', ppd_match_id } with a FUTURE ISO hold_expires_at", async () => {
    // Arrange
    const { invoiceCandidates } = arm(createSupabaseMock());
    armScore(0.75);

    // Act
    await processMatchesForPpdRows([makeRow()]);

    // Assert
    expect(invoiceCandidates.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "audit_match",
        status: "on_hold_branch_query",
        ppd_match_id: MATCH_ID,
      }),
    );
    // hold_expires_at: 10 business days out — pin only "future ISO timestamp",
    // not the exact business-day arithmetic.
    const payload = invoiceCandidates.insert.mock.calls[0][0] as {
      hold_expires_at: string;
    };
    expect(payload.hold_expires_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(new Date(payload.hold_expires_at).getTime()).toBeGreaterThan(
      NOW.getTime(),
    );
  });

  it("...and emits inngest 'truedeed/audit-query.raised' { matchId, introductionId, listingId } for the clause-10.2 email job", async () => {
    // Arrange
    arm(createSupabaseMock());
    armScore(0.75);

    // Act
    await processMatchesForPpdRows([makeRow()]);

    // Assert
    expect(inngest.send).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "truedeed/audit-query.raised",
        data: expect.objectContaining({
          matchId: MATCH_ID,
          introductionId: INTRO_ID,
          listingId: LISTING_ID,
        }),
      }),
    );
  });

  it("score in [WATCHLIST, AUDIT_QUERY) → ops watchlist only: { mode: 'audit', status: 'pending_review' }, NO invoice candidate, NO event", async () => {
    // Arrange
    const { matchCandidates, invoiceCandidates } = arm(createSupabaseMock());
    armScore(0.6); // in [0.55, 0.7)

    // Act
    const result = await processMatchesForPpdRows([makeRow()]);

    // Assert
    expect(matchCandidates.insert).toHaveBeenCalledWith(
      expect.objectContaining({ mode: "audit", status: "pending_review" }),
    );
    expect(invoiceCandidates.insert).not.toHaveBeenCalled();
    expect(inngest.send).not.toHaveBeenCalled();
    expect(result).toEqual({ created: 1, queried: 0 });
  });

  it("score below the WATCHLIST CONSTANT (0.52 < mocked 0.55, though >= the spec's 0.50) → nothing inserted", async () => {
    // Arrange — pins that the service reads WATCHLIST rather than hardcoding
    // 0.50: a hardcoded service would create a watchlist row for 0.52.
    const { matchCandidates, invoiceCandidates } = arm(createSupabaseMock());
    armScore(0.52);

    // Act
    const result = await processMatchesForPpdRows([makeRow()]);

    // Assert
    expect(matchCandidates.insert).not.toHaveBeenCalled();
    expect(invoiceCandidates.insert).not.toHaveBeenCalled();
    expect(inngest.send).not.toHaveBeenCalled();
    expect(result).toEqual({ created: 0, queried: 0 });
  });
});

// ---------------------------------------------------------------------------
// 4. Duplicates & error isolation
// ---------------------------------------------------------------------------

describe("processMatchesForPpdRows — duplicates & error isolation", () => {
  it("a 23505 unique-violation (ppd_tuid+listing_id already matched) is skipped silently: counted in neither, no invoice, no event, not null", async () => {
    // Arrange
    const { invoiceCandidates } = arm(
      createSupabaseMock({
        matchInsert: {
          data: null,
          error: {
            code: "23505",
            message:
              'duplicate key value violates unique constraint "ppd_match_candidates_ppd_tuid_listing_id_key"',
          },
        },
      }),
    );
    armScore(0.75); // would otherwise raise an audit query

    // Act
    const result = await processMatchesForPpdRows([makeRow()]);

    // Assert
    expect(result).toEqual({ created: 0, queried: 0 });
    expect(invoiceCandidates.insert).not.toHaveBeenCalled();
    expect(inngest.send).not.toHaveBeenCalled();
  });

  it("one bad row does not abort the batch: a failing listings query skips that row, the next row is still processed", async () => {
    // Arrange — first listings query errors, second succeeds (queue)
    arm(
      createSupabaseMock({
        listingsSelect: [
          err("canceling statement due to statement timeout"),
          ok([AUDIT_LISTING]),
        ],
      }),
    );
    armScore(0.75);

    // Act
    const result = await processMatchesForPpdRows([
      makeRow({ tuid: "BAD-ROW-TUID", postcode: "SW1A 1AA" }),
      makeRow(),
    ]);

    // Assert — only the second row produced an audit query; no null
    expect(result).toEqual({ created: 1, queried: 1 });
    expect(inngest.send).toHaveBeenCalledTimes(1);
  });

  it("resolves null (never throws) on top-level failure (createAdminClient throws)", async () => {
    // Arrange
    vi.mocked(createAdminClient).mockImplementation(() => {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");
    });
    armScore(0.75);

    // Act + Assert
    await expect(processMatchesForPpdRows([makeRow()])).resolves.toBeNull();
    expect(inngest.send).not.toHaveBeenCalled();
  });
});
