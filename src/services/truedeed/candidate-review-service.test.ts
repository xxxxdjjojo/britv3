/**
 * Tests for truedeed candidate-review-service (TDD RED — service not yet implemented)
 *
 * Pins the contract of @/services/truedeed/candidate-review-service:
 *  1. listPendingCandidates() → CandidateReviewItem[] | null
 *     - selects invoice_candidates with status in
 *       ('pending_review', 'on_hold_branch_query'), joined to the
 *       introduction (applicant snapshot, occurred_at, notified_at,
 *       rebuttal_deadline, listing address via listings → properties,
 *       events count) and the reported outcome (spec §5: one screen =
 *       introduction facts + event trail + outcome/match).
 *     - maps to the review-screen shape:
 *       { candidateId, source, status, amountPence, vatPence,
 *         introduction: { applicantName, occurredAt, notifiedAt,
 *           rebuttalDeadline, listingAddress, eventsCount },
 *         outcome: { outcome, completionDate, agreedPricePence } | null,
 *         holdExpiresAt }
 *     - null on query error (never throws)
 *  2. decideCandidate({ candidateId, reviewerId, decision, note? }) → boolean
 *     - 'rejected' with an empty note → false WITHOUT calling the rpc
 *     - calls rpc 'review_invoice_candidate'
 *     - on 'approved' success: also emits inngest
 *       'truedeed/invoice-candidate.approved' { candidateId } and inserts
 *       a truedeed_audit_log row
 *     - on rpc error → false, no inngest
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
import { inngest } from "@/inngest/client";
import {
  listPendingCandidates,
  decideCandidate,
} from "@/services/truedeed/candidate-review-service";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const INTRO_ID = "eeeeeeee-0000-4000-8000-000000000005";
const CANDIDATE_ID = "44444444-0000-4000-8000-00000000000d";
const HELD_CANDIDATE_ID = "22222222-0000-4000-8000-00000000000f";
const REVIEWER_ID = "33333333-0000-4000-8000-00000000000e";

const NOW = new Date("2026-06-12T10:00:00.000Z");

/**
 * Raw joined row as returned by the invoice_candidates select
 * (introduction embed with listings → properties address and an
 * introduction_events count aggregate).
 */
const CANDIDATE_ROW = {
  id: CANDIDATE_ID,
  source: "agent_report",
  status: "pending_review",
  amount_pence: 250000,
  vat_pence: 50000,
  hold_expires_at: null,
  introduction: {
    id: INTRO_ID,
    applicant_name: "Jane Buyer",
    occurred_at: "2026-06-01T09:00:00.000Z",
    notified_at: "2026-06-01T09:05:00.000Z",
    rebuttal_deadline: "2026-06-19T17:00:00.000Z",
    listing: {
      property: {
        address_line1: "12 Synthetic Street",
        city: "London",
        postcode: "SW1A 1AA",
      },
    },
    introduction_events: [{ count: 4 }],
  },
  reported_outcome: {
    outcome: "completed",
    completion_date: "2026-06-10",
    agreed_price_pence: 45000000,
  },
};

const HELD_CANDIDATE_ROW = {
  ...CANDIDATE_ROW,
  id: HELD_CANDIDATE_ID,
  source: "audit_match",
  status: "on_hold_branch_query",
  hold_expires_at: "2026-06-20T10:00:00.000Z",
  reported_outcome: null,
};

type DbResult = { data: unknown; error: unknown };
const ok = (data: unknown = null): DbResult => ({ data, error: null });

/** Chainable per-table mock (pattern from listings/create.test.ts). */
function createTableChain(results: { insert?: DbResult; select?: DbResult }) {
  let op: "insert" | "select" = "select";
  const resolveResult = () => results[op] ?? ok();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: any = {};
  for (const method of ["eq", "match", "order", "limit", "is", "in"]) {
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

function createSupabaseMock(overrides?: { candidatesSelect?: DbResult }) {
  const candidates = createTableChain({
    select:
      overrides?.candidatesSelect ?? ok([CANDIDATE_ROW, HELD_CANDIDATE_ROW]),
  });
  const auditLog = createTableChain({ insert: ok() });

  const from = vi.fn((table: string) => {
    switch (table) {
      case "invoice_candidates":
        return candidates;
      case "truedeed_audit_log":
        return auditLog;
      default:
        return createTableChain({});
    }
  });

  const rpc = vi.fn().mockResolvedValue(ok());

  const supabase = { from, rpc };
  return { supabase, from, rpc, candidates, auditLog };
}

function arm(mock: ReturnType<typeof createSupabaseMock>) {
  vi.mocked(createAdminClient).mockReturnValue(mock.supabase as never);
  return mock;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ["Date"], now: NOW });
  vi.mocked(inngest.send).mockResolvedValue(undefined as never);
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// 1. listPendingCandidates
// ---------------------------------------------------------------------------

describe("listPendingCandidates", () => {
  it("queries invoice_candidates with status in ('pending_review', 'on_hold_branch_query')", async () => {
    const { from, candidates } = arm(createSupabaseMock());

    await listPendingCandidates();

    expect(from).toHaveBeenCalledWith("invoice_candidates");
    expect(candidates.in).toHaveBeenCalledWith(
      "status",
      expect.arrayContaining(["pending_review", "on_hold_branch_query"]),
    );
  });

  it("maps a pending candidate to the review-screen shape (candidate + introduction facts + outcome)", async () => {
    arm(createSupabaseMock());

    const result = await listPendingCandidates();

    expect(result).not.toBeNull();
    expect(result).toHaveLength(2);

    const item = result!.find((c) => c.candidateId === CANDIDATE_ID);
    expect(item).toMatchObject({
      candidateId: CANDIDATE_ID,
      source: "agent_report",
      status: "pending_review",
      amountPence: 250000,
      vatPence: 50000,
      holdExpiresAt: null,
      introduction: {
        applicantName: "Jane Buyer",
        occurredAt: "2026-06-01T09:00:00.000Z",
        notifiedAt: "2026-06-01T09:05:00.000Z",
        rebuttalDeadline: "2026-06-19T17:00:00.000Z",
        eventsCount: 4,
      },
      outcome: {
        outcome: "completed",
        completionDate: "2026-06-10",
        agreedPricePence: 45000000,
      },
    });

    // Listing address resolved via listings → properties
    expect(item!.introduction.listingAddress).toContain("12 Synthetic Street");
    expect(item!.introduction.listingAddress).toContain("SW1A 1AA");
  });

  it("maps an on-hold candidate with no reported outcome: outcome null, holdExpiresAt passed through", async () => {
    arm(createSupabaseMock());

    const result = await listPendingCandidates();

    const held = result!.find((c) => c.candidateId === HELD_CANDIDATE_ID);
    expect(held).toMatchObject({
      candidateId: HELD_CANDIDATE_ID,
      source: "audit_match",
      status: "on_hold_branch_query",
      outcome: null,
      holdExpiresAt: "2026-06-20T10:00:00.000Z",
    });
  });

  it("returns null on query error (never throws)", async () => {
    arm(
      createSupabaseMock({
        candidatesSelect: { data: null, error: { message: "boom" } },
      }),
    );

    await expect(listPendingCandidates()).resolves.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 2. decideCandidate
// ---------------------------------------------------------------------------

describe("decideCandidate", () => {
  it("returns false WITHOUT calling the rpc when decision is 'rejected' and the note is empty", async () => {
    const { rpc } = arm(createSupabaseMock());

    const result = await decideCandidate({
      candidateId: CANDIDATE_ID,
      reviewerId: REVIEWER_ID,
      decision: "rejected",
      note: "",
    });

    expect(result).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("on 'approved' calls rpc 'review_invoice_candidate', emits 'truedeed/invoice-candidate.approved' { candidateId } and inserts an audit log row", async () => {
    const { rpc, auditLog } = arm(createSupabaseMock());

    const result = await decideCandidate({
      candidateId: CANDIDATE_ID,
      reviewerId: REVIEWER_ID,
      decision: "approved",
    });

    expect(result).toBe(true);
    const reviewCall = rpc.mock.calls.find(
      (c) => c[0] === "review_invoice_candidate",
    );
    expect(reviewCall).toBeDefined();
    expect(JSON.stringify(reviewCall![1])).toContain(CANDIDATE_ID);
    expect(JSON.stringify(reviewCall![1])).toContain(REVIEWER_ID);

    expect(inngest.send).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "truedeed/invoice-candidate.approved",
        data: expect.objectContaining({ candidateId: CANDIDATE_ID }),
      }),
    );
    expect(auditLog.insert).toHaveBeenCalledTimes(1);
  });

  it("on 'rejected' with a note calls the rpc and does NOT emit the approved event", async () => {
    const { rpc } = arm(createSupabaseMock());

    const result = await decideCandidate({
      candidateId: CANDIDATE_ID,
      reviewerId: REVIEWER_ID,
      decision: "rejected",
      note: "Land Registry price does not match the reported outcome",
    });

    expect(result).toBe(true);
    expect(
      rpc.mock.calls.find((c) => c[0] === "review_invoice_candidate"),
    ).toBeDefined();
    expect(inngest.send).not.toHaveBeenCalled();
  });

  it("returns false and emits no inngest event when the rpc errors", async () => {
    const { rpc } = arm(createSupabaseMock());
    rpc.mockResolvedValue({ data: null, error: { message: "boom" } });

    const result = await decideCandidate({
      candidateId: CANDIDATE_ID,
      reviewerId: REVIEWER_ID,
      decision: "approved",
    });

    expect(result).toBe(false);
    expect(inngest.send).not.toHaveBeenCalled();
  });
});
