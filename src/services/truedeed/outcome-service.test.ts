/**
 * Tests for truedeed outcome-service (TDD RED — service not yet implemented)
 *
 * Pins the contract of @/services/truedeed/outcome-service:
 *  1. reportOutcome({ introductionId, reportedBy, outcome, completionDate?, agreedPricePence? })
 *     → { ok: true; outcomeId; invoiceCandidateId? } | { ok: false; error }
 *     Errors pinned:
 *       'not_authorised'             reportedBy is neither the introduction's
 *                                    agent nor a team member on its branch
 *       'missing_completion_fields'  outcome 'completed' without completionDate
 *                                    or agreedPricePence
 *       'invalid_state'              rpc 'transition_introduction' rejects the
 *                                    transition (e.g. already completed) —
 *                                    NO invoice candidate is created (the
 *                                    transition happens BEFORE candidate creation)
 *       'internal'                   any thrown supabase error (never throws)
 *  2. Happy 'completed': inserts reported_outcomes (completion_date 'YYYY-MM-DD',
 *     agreed_price_pence), creates invoice_candidates { source: 'agent_report',
 *     introduction_id, reported_outcome_id, status: 'pending_review' }, calls
 *     rpc 'transition_introduction' with 'converted_completed', writes
 *     truedeed_audit_log, emits inngest 'truedeed/outcome.reported', returns
 *     the invoiceCandidateId.
 *  3. Outcome → status transition mapping:
 *       offer_accepted → 'converted_sstc'
 *       exchanged      → 'converted_exchanged'
 *       completed      → 'converted_completed'
 *       fell_through   → NO transition; introduction_events row with
 *                        event_type 'note' and payload containing 'fell_through'
 *       tenancy_commenced / tenancy_abandoned → outcome row only,
 *                        no transition, no invoice candidate
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
import { reportOutcome } from "@/services/truedeed/outcome-service";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const INTRO_ID = "eeeeeeee-0000-4000-8000-000000000005";
const AGENT_ID = "cccccccc-0000-4000-8000-000000000003";
const BRANCH_ID = "dddddddd-0000-4000-8000-000000000004";
const TEAM_MEMBER_ID = "99999999-0000-4000-8000-000000000008";
const STRANGER_ID = "88888888-0000-4000-8000-000000000009";
const OUTCOME_ID = "55555555-0000-4000-8000-00000000000c";
const CANDIDATE_ID = "44444444-0000-4000-8000-00000000000d";

const NOW = new Date("2026-06-12T10:00:00.000Z");

const INTRODUCTION_ROW = {
  id: INTRO_ID,
  agent_id: AGENT_ID,
  branch_id: BRANCH_ID,
  occurred_at: "2026-06-01T09:00:00.000Z",
  status: "active",
};

const COMPLETION_DATE = new Date("2026-06-10T00:00:00.000Z");
const AGREED_PRICE_PENCE = 45000000;

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

function createSupabaseMock(overrides?: {
  introductionSelect?: DbResult;
  teamMembersSelect?: DbResult;
  outcomeInsert?: DbResult;
  candidateInsert?: DbResult;
}) {
  const introductions = createTableChain({
    select: overrides?.introductionSelect ?? ok(INTRODUCTION_ROW),
  });
  const teamMembers = createTableChain({
    select: overrides?.teamMembersSelect ?? ok([]),
  });
  const outcomes = createTableChain({
    insert: overrides?.outcomeInsert ?? ok({ id: OUTCOME_ID }),
  });
  const candidates = createTableChain({
    insert: overrides?.candidateInsert ?? ok({ id: CANDIDATE_ID }),
  });
  const auditLog = createTableChain({ insert: ok() });
  const events = createTableChain({ insert: ok() });

  const from = vi.fn((table: string) => {
    switch (table) {
      case "introductions":
        return introductions;
      case "agent_team_members":
        return teamMembers;
      case "reported_outcomes":
        return outcomes;
      case "invoice_candidates":
        return candidates;
      case "truedeed_audit_log":
        return auditLog;
      case "introduction_events":
        return events;
      default:
        return createTableChain({});
    }
  });

  const rpc = vi.fn().mockResolvedValue(ok());

  const supabase = { from, rpc };
  return {
    supabase,
    from,
    rpc,
    introductions,
    teamMembers,
    outcomes,
    candidates,
    auditLog,
    events,
  };
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
// 1. reportOutcome — validation errors
// ---------------------------------------------------------------------------

describe("reportOutcome — validation errors", () => {
  it("returns 'not_authorised' when reportedBy is neither the agent nor a branch team member, and inserts nothing", async () => {
    const { outcomes, candidates, rpc } = arm(
      createSupabaseMock({ teamMembersSelect: ok([]) }),
    );

    const result = await reportOutcome({
      introductionId: INTRO_ID,
      reportedBy: STRANGER_ID,
      outcome: "completed",
      completionDate: COMPLETION_DATE,
      agreedPricePence: AGREED_PRICE_PENCE,
    });

    expect(result).toEqual({ ok: false, error: "not_authorised" });
    expect(outcomes.insert).not.toHaveBeenCalled();
    expect(candidates.insert).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("returns 'missing_completion_fields' when outcome 'completed' lacks completionDate", async () => {
    const { outcomes, rpc } = arm(createSupabaseMock());

    const result = await reportOutcome({
      introductionId: INTRO_ID,
      reportedBy: AGENT_ID,
      outcome: "completed",
      agreedPricePence: AGREED_PRICE_PENCE,
    });

    expect(result).toEqual({ ok: false, error: "missing_completion_fields" });
    expect(outcomes.insert).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("returns 'missing_completion_fields' when outcome 'completed' lacks agreedPricePence", async () => {
    const { outcomes, rpc } = arm(createSupabaseMock());

    const result = await reportOutcome({
      introductionId: INTRO_ID,
      reportedBy: AGENT_ID,
      outcome: "completed",
      completionDate: COMPLETION_DATE,
    });

    expect(result).toEqual({ ok: false, error: "missing_completion_fields" });
    expect(outcomes.insert).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 2. reportOutcome — happy 'completed'
// ---------------------------------------------------------------------------

describe("reportOutcome — happy 'completed'", () => {
  it("inserts the reported_outcomes row with completion_date 'YYYY-MM-DD' and agreed_price_pence", async () => {
    const { outcomes } = arm(createSupabaseMock());

    await reportOutcome({
      introductionId: INTRO_ID,
      reportedBy: AGENT_ID,
      outcome: "completed",
      completionDate: COMPLETION_DATE,
      agreedPricePence: AGREED_PRICE_PENCE,
    });

    expect(outcomes.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        introduction_id: INTRO_ID,
        outcome: "completed",
        completion_date: "2026-06-10",
        agreed_price_pence: AGREED_PRICE_PENCE,
      }),
    );
  });

  it("creates the invoice candidate { source: 'agent_report', status: 'pending_review' } linked to the outcome row", async () => {
    const { candidates } = arm(createSupabaseMock());

    await reportOutcome({
      introductionId: INTRO_ID,
      reportedBy: AGENT_ID,
      outcome: "completed",
      completionDate: COMPLETION_DATE,
      agreedPricePence: AGREED_PRICE_PENCE,
    });

    expect(candidates.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "agent_report",
        introduction_id: INTRO_ID,
        reported_outcome_id: OUTCOME_ID,
        status: "pending_review",
      }),
    );
  });

  it("calls rpc 'transition_introduction' with 'converted_completed', writes the audit log, emits 'truedeed/outcome.reported' and returns the invoiceCandidateId", async () => {
    const { rpc, auditLog } = arm(createSupabaseMock());

    const result = await reportOutcome({
      introductionId: INTRO_ID,
      reportedBy: AGENT_ID,
      outcome: "completed",
      completionDate: COMPLETION_DATE,
      agreedPricePence: AGREED_PRICE_PENCE,
    });

    const transitionCall = rpc.mock.calls.find(
      (c) => c[0] === "transition_introduction",
    );
    expect(transitionCall).toBeDefined();
    expect(JSON.stringify(transitionCall![1])).toContain("converted_completed");

    expect(auditLog.insert).toHaveBeenCalledTimes(1);
    expect(inngest.send).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "truedeed/outcome.reported",
        data: expect.objectContaining({ outcomeId: OUTCOME_ID }),
      }),
    );
    expect(result).toEqual({
      ok: true,
      outcomeId: OUTCOME_ID,
      invoiceCandidateId: CANDIDATE_ID,
    });
  });

  it("allows a branch team member (not the agent) to report", async () => {
    arm(
      createSupabaseMock({
        teamMembersSelect: ok([
          { user_id: TEAM_MEMBER_ID, branch_id: BRANCH_ID },
        ]),
      }),
    );

    const result = await reportOutcome({
      introductionId: INTRO_ID,
      reportedBy: TEAM_MEMBER_ID,
      outcome: "completed",
      completionDate: COMPLETION_DATE,
      agreedPricePence: AGREED_PRICE_PENCE,
    });

    expect(result).toEqual(
      expect.objectContaining({ ok: true, outcomeId: OUTCOME_ID }),
    );
  });
});

// ---------------------------------------------------------------------------
// 3. reportOutcome — outcome → status transition mapping
// ---------------------------------------------------------------------------

describe("reportOutcome — outcome → status transition mapping", () => {
  it("offer_accepted → rpc 'transition_introduction' with 'converted_sstc'", async () => {
    const { rpc } = arm(createSupabaseMock());

    const result = await reportOutcome({
      introductionId: INTRO_ID,
      reportedBy: AGENT_ID,
      outcome: "offer_accepted",
      agreedPricePence: AGREED_PRICE_PENCE,
    });

    expect(result).toEqual(
      expect.objectContaining({ ok: true, outcomeId: OUTCOME_ID }),
    );
    const transitionCall = rpc.mock.calls.find(
      (c) => c[0] === "transition_introduction",
    );
    expect(transitionCall).toBeDefined();
    expect(JSON.stringify(transitionCall![1])).toContain("converted_sstc");
  });

  it("exchanged → rpc 'transition_introduction' with 'converted_exchanged'", async () => {
    const { rpc } = arm(createSupabaseMock());

    const result = await reportOutcome({
      introductionId: INTRO_ID,
      reportedBy: AGENT_ID,
      outcome: "exchanged",
      agreedPricePence: AGREED_PRICE_PENCE,
    });

    expect(result).toEqual(
      expect.objectContaining({ ok: true, outcomeId: OUTCOME_ID }),
    );
    const transitionCall = rpc.mock.calls.find(
      (c) => c[0] === "transition_introduction",
    );
    expect(transitionCall).toBeDefined();
    expect(JSON.stringify(transitionCall![1])).toContain(
      "converted_exchanged",
    );
  });

  it("fell_through → NO transition rpc; appends an introduction_events 'note' with payload containing 'fell_through'", async () => {
    const { rpc, events, candidates } = arm(createSupabaseMock());

    const result = await reportOutcome({
      introductionId: INTRO_ID,
      reportedBy: AGENT_ID,
      outcome: "fell_through",
    });

    expect(result).toEqual(
      expect.objectContaining({ ok: true, outcomeId: OUTCOME_ID }),
    );
    expect(
      rpc.mock.calls.find((c) => c[0] === "transition_introduction"),
    ).toBeUndefined();
    expect(events.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        introduction_id: INTRO_ID,
        event_type: "note",
      }),
    );
    expect(JSON.stringify(events.insert.mock.calls[0][0])).toContain(
      "fell_through",
    );
    expect(candidates.insert).not.toHaveBeenCalled();
  });

  it.each(["tenancy_commenced", "tenancy_abandoned"] as const)(
    "%s → outcome row only: no transition rpc, no invoice candidate",
    async (outcome) => {
      const { rpc, outcomes, candidates } = arm(createSupabaseMock());

      const result = await reportOutcome({
        introductionId: INTRO_ID,
        reportedBy: AGENT_ID,
        outcome,
      });

      expect(result).toEqual(
        expect.objectContaining({ ok: true, outcomeId: OUTCOME_ID }),
      );
      expect(outcomes.insert).toHaveBeenCalledWith(
        expect.objectContaining({ introduction_id: INTRO_ID, outcome }),
      );
      expect(
        rpc.mock.calls.find((c) => c[0] === "transition_introduction"),
      ).toBeUndefined();
      expect(candidates.insert).not.toHaveBeenCalled();
    },
  );
});

// ---------------------------------------------------------------------------
// 4. reportOutcome — invalid transition and internal errors
// ---------------------------------------------------------------------------

describe("reportOutcome — invalid transition and internal errors", () => {
  it("returns 'invalid_state' and creates NO invoice candidate when the transition rpc rejects (transition runs BEFORE candidate creation)", async () => {
    const { rpc, candidates } = arm(createSupabaseMock());
    rpc.mockResolvedValue({
      data: null,
      error: {
        message:
          "invalid transition: converted_completed -> converted_completed",
      },
    });

    const result = await reportOutcome({
      introductionId: INTRO_ID,
      reportedBy: AGENT_ID,
      outcome: "completed",
      completionDate: COMPLETION_DATE,
      agreedPricePence: AGREED_PRICE_PENCE,
    });

    expect(result).toEqual({ ok: false, error: "invalid_state" });
    expect(candidates.insert).not.toHaveBeenCalled();
  });

  it("returns { ok: false, error: 'internal' } (never throws) when supabase throws", async () => {
    const mock = arm(createSupabaseMock());
    mock.from.mockImplementation(() => {
      throw new Error("connection reset");
    });

    await expect(
      reportOutcome({
        introductionId: INTRO_ID,
        reportedBy: AGENT_ID,
        outcome: "completed",
        completionDate: COMPLETION_DATE,
        agreedPricePence: AGREED_PRICE_PENCE,
      }),
    ).resolves.toEqual({ ok: false, error: "internal" });
    expect(inngest.send).not.toHaveBeenCalled();
  });
});
