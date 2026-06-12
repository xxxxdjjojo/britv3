/**
 * Tests for truedeed rebuttal-service (TDD RED — service not yet implemented)
 *
 * Pins the contract of @/services/truedeed/rebuttal-service:
 *  1. submitRebuttal({ introductionId, userId, evidenceDatedAt, files })
 *     → { ok: true; rebuttalId } | { ok: false; error }
 *     Errors pinned:
 *       'window_expired'         now > introduction.rebuttal_deadline
 *       'not_authorised'         user is neither the introduction's agent
 *                                nor a team member on its branch
 *       'evidence_not_predating' evidenceDatedAt >= introduction.occurred_at
 *       'no_evidence'            empty files array
 *     Success: each file uploaded to the 'rebuttal-evidence' storage bucket
 *     (paths include the introductionId), rebuttals row inserted with
 *     evidence_storage_paths, audit log written.
 *  2. decideRebuttal({ rebuttalId, adminId, decision, reason }) → boolean
 *     - reason required: empty reason → false, no rpc
 *     - calls rpc 'decide_rebuttal'
 *     - decision 'upheld' → additionally rpc 'transition_introduction'
 *       with 'rebutted'
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

import { createAdminClient } from "@/lib/supabase/admin";
import {
  submitRebuttal,
  decideRebuttal,
} from "@/services/truedeed/rebuttal-service";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const INTRO_ID = "eeeeeeee-0000-4000-8000-000000000005";
const AGENT_ID = "cccccccc-0000-4000-8000-000000000003";
const BRANCH_ID = "dddddddd-0000-4000-8000-000000000004";
const TEAM_MEMBER_ID = "99999999-0000-4000-8000-000000000008";
const STRANGER_ID = "88888888-0000-4000-8000-000000000009";
const REBUTTAL_ID = "77777777-0000-4000-8000-00000000000a";
const ADMIN_ID = "66666666-0000-4000-8000-00000000000b";

const NOW = new Date("2026-06-12T10:00:00.000Z");

const INTRODUCTION_ROW = {
  id: INTRO_ID,
  agent_id: AGENT_ID,
  branch_id: BRANCH_ID,
  occurred_at: "2026-06-01T09:00:00.000Z",
  rebuttal_deadline: "2026-06-19T17:00:00.000Z", // in the future relative to NOW
  status: "active",
};

type DbResult = { data: unknown; error: unknown };
const ok = (data: unknown = null): DbResult => ({ data, error: null });

function makeEvidenceFiles(count = 1): File[] {
  return Array.from(
    { length: count },
    (_, i) =>
      new File([`synthetic evidence ${i}`], `evidence-${i}.pdf`, {
        type: "application/pdf",
      }),
  );
}

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
  rebuttalInsert?: DbResult;
  rebuttalSelect?: DbResult;
}) {
  const introductions = createTableChain({
    select: overrides?.introductionSelect ?? ok(INTRODUCTION_ROW),
  });
  const teamMembers = createTableChain({
    select: overrides?.teamMembersSelect ?? ok([]),
  });
  const rebuttals = createTableChain({
    insert: overrides?.rebuttalInsert ?? ok({ id: REBUTTAL_ID }),
    select:
      overrides?.rebuttalSelect ??
      ok({ id: REBUTTAL_ID, introduction_id: INTRO_ID }),
  });
  const auditLog = createTableChain({ insert: ok() });

  const from = vi.fn((table: string) => {
    switch (table) {
      case "introductions":
        return introductions;
      case "agent_team_members":
        return teamMembers;
      case "rebuttals":
        return rebuttals;
      case "truedeed_audit_log":
        return auditLog;
      default:
        return createTableChain({});
    }
  });

  const upload = vi
    .fn()
    .mockResolvedValue({ data: { path: "synthetic/path" }, error: null });
  const storageFrom = vi.fn(() => ({ upload }));

  const rpc = vi.fn().mockResolvedValue(ok());

  const supabase = { from, rpc, storage: { from: storageFrom } };
  return {
    supabase,
    from,
    rpc,
    introductions,
    teamMembers,
    rebuttals,
    auditLog,
    storageFrom,
    upload,
  };
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
// 1. submitRebuttal — validation errors
// ---------------------------------------------------------------------------

describe("submitRebuttal — validation errors", () => {
  it("returns 'window_expired' when now is past rebuttal_deadline, and uploads nothing", async () => {
    const { upload } = arm(
      createSupabaseMock({
        introductionSelect: ok({
          ...INTRODUCTION_ROW,
          rebuttal_deadline: "2026-06-10T17:00:00.000Z", // before NOW
        }),
      }),
    );

    const result = await submitRebuttal({
      introductionId: INTRO_ID,
      userId: AGENT_ID,
      evidenceDatedAt: new Date("2026-05-20T00:00:00.000Z"),
      files: makeEvidenceFiles(1),
    });

    expect(result).toEqual({ ok: false, error: "window_expired" });
    expect(upload).not.toHaveBeenCalled();
  });

  it("returns 'not_authorised' when the user is neither the agent nor a branch team member", async () => {
    const { upload } = arm(
      createSupabaseMock({ teamMembersSelect: ok([]) }),
    );

    const result = await submitRebuttal({
      introductionId: INTRO_ID,
      userId: STRANGER_ID,
      evidenceDatedAt: new Date("2026-05-20T00:00:00.000Z"),
      files: makeEvidenceFiles(1),
    });

    expect(result).toEqual({ ok: false, error: "not_authorised" });
    expect(upload).not.toHaveBeenCalled();
  });

  it("returns 'evidence_not_predating' when evidenceDatedAt >= introduction.occurred_at", async () => {
    const { upload } = arm(createSupabaseMock());

    const result = await submitRebuttal({
      introductionId: INTRO_ID,
      userId: AGENT_ID,
      evidenceDatedAt: new Date("2026-06-05T00:00:00.000Z"), // after occurred_at
      files: makeEvidenceFiles(1),
    });

    expect(result).toEqual({ ok: false, error: "evidence_not_predating" });
    expect(upload).not.toHaveBeenCalled();
  });

  it("returns 'no_evidence' when files is empty", async () => {
    const { upload, rebuttals } = arm(createSupabaseMock());

    const result = await submitRebuttal({
      introductionId: INTRO_ID,
      userId: AGENT_ID,
      evidenceDatedAt: new Date("2026-05-20T00:00:00.000Z"),
      files: [],
    });

    expect(result).toEqual({ ok: false, error: "no_evidence" });
    expect(upload).not.toHaveBeenCalled();
    expect(rebuttals.insert).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 2. submitRebuttal — success
// ---------------------------------------------------------------------------

describe("submitRebuttal — success", () => {
  it("uploads every file to the 'rebuttal-evidence' bucket with paths including the introductionId", async () => {
    const { storageFrom, upload } = arm(createSupabaseMock());

    await submitRebuttal({
      introductionId: INTRO_ID,
      userId: AGENT_ID,
      evidenceDatedAt: new Date("2026-05-20T00:00:00.000Z"),
      files: makeEvidenceFiles(2),
    });

    expect(storageFrom).toHaveBeenCalledWith("rebuttal-evidence");
    expect(upload).toHaveBeenCalledTimes(2);
    for (const call of upload.mock.calls) {
      expect(String(call[0])).toContain(INTRO_ID);
    }
  });

  it("sanitises client filenames: traversal and special characters cannot escape the introduction's folder", async () => {
    const { upload } = arm(createSupabaseMock());

    const hostile = [
      new File(["x"], "../../other-intro/escape.pdf", {
        type: "application/pdf",
      }),
      new File(["x"], "..\\windows\\esc ape%00.pdf", {
        type: "application/pdf",
      }),
      new File(["x"], "...hidden.pdf", { type: "application/pdf" }),
    ];

    const result = await submitRebuttal({
      introductionId: INTRO_ID,
      userId: AGENT_ID,
      evidenceDatedAt: new Date("2026-05-20T00:00:00.000Z"),
      files: hostile,
    });

    expect(result.ok).toBe(true);
    expect(upload).toHaveBeenCalledTimes(3);
    for (const call of upload.mock.calls) {
      const path = String(call[0]);
      // Exactly one folder level — the introduction id — and a key made only
      // of safe characters that cannot start with a dot.
      expect(path).toMatch(
        new RegExp(`^${INTRO_ID}/[A-Za-z0-9_][A-Za-z0-9._-]*$`),
      );
      expect(path).not.toContain("..");
    }
  });

  it("inserts the rebuttals row with evidence_storage_paths, writes the audit log, and returns the rebuttalId", async () => {
    const { rebuttals, auditLog } = arm(createSupabaseMock());

    const result = await submitRebuttal({
      introductionId: INTRO_ID,
      userId: AGENT_ID,
      evidenceDatedAt: new Date("2026-05-20T00:00:00.000Z"),
      files: makeEvidenceFiles(2),
    });

    expect(result).toEqual({ ok: true, rebuttalId: REBUTTAL_ID });
    expect(rebuttals.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        introduction_id: INTRO_ID,
        evidence_storage_paths: expect.arrayContaining([
          expect.stringContaining(INTRO_ID),
        ]),
      }),
    );
    expect(auditLog.insert).toHaveBeenCalledTimes(1);
  });

  it("allows a branch team member (not the agent) to submit", async () => {
    arm(
      createSupabaseMock({
        teamMembersSelect: ok([{ user_id: TEAM_MEMBER_ID, branch_id: BRANCH_ID }]),
      }),
    );

    const result = await submitRebuttal({
      introductionId: INTRO_ID,
      userId: TEAM_MEMBER_ID,
      evidenceDatedAt: new Date("2026-05-20T00:00:00.000Z"),
      files: makeEvidenceFiles(1),
    });

    expect(result).toEqual({ ok: true, rebuttalId: REBUTTAL_ID });
  });
});

// ---------------------------------------------------------------------------
// 3. decideRebuttal
// ---------------------------------------------------------------------------

describe("decideRebuttal", () => {
  it("returns false and calls no rpc when reason is empty", async () => {
    const { rpc } = arm(createSupabaseMock());

    const result = await decideRebuttal({
      rebuttalId: REBUTTAL_ID,
      adminId: ADMIN_ID,
      decision: "upheld",
      reason: "",
    });

    expect(result).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("calls rpc 'decide_rebuttal' for a 'rejected' decision and does NOT transition the introduction", async () => {
    const { rpc } = arm(createSupabaseMock());

    const result = await decideRebuttal({
      rebuttalId: REBUTTAL_ID,
      adminId: ADMIN_ID,
      decision: "rejected",
      reason: "Evidence does not pre-date the introduction",
    });

    expect(result).toBe(true);
    const decideCall = rpc.mock.calls.find((c) => c[0] === "decide_rebuttal");
    expect(decideCall).toBeDefined();
    expect(JSON.stringify(decideCall![1])).toContain(REBUTTAL_ID);
    expect(
      rpc.mock.calls.find((c) => c[0] === "transition_introduction"),
    ).toBeUndefined();
  });

  it("on 'upheld' also calls rpc 'transition_introduction' with 'rebutted'", async () => {
    const { rpc } = arm(createSupabaseMock());

    const result = await decideRebuttal({
      rebuttalId: REBUTTAL_ID,
      adminId: ADMIN_ID,
      decision: "upheld",
      reason: "Prior-contact evidence verified",
    });

    expect(result).toBe(true);
    expect(rpc.mock.calls.find((c) => c[0] === "decide_rebuttal")).toBeDefined();
    const transitionCall = rpc.mock.calls.find(
      (c) => c[0] === "transition_introduction",
    );
    expect(transitionCall).toBeDefined();
    expect(JSON.stringify(transitionCall![1])).toContain("rebutted");
  });

  it("returns false when the decide_rebuttal rpc errors", async () => {
    const { rpc } = arm(createSupabaseMock());
    rpc.mockResolvedValue({ data: null, error: { message: "boom" } });

    const result = await decideRebuttal({
      rebuttalId: REBUTTAL_ID,
      adminId: ADMIN_ID,
      decision: "rejected",
      reason: "Some reason",
    });

    expect(result).toBe(false);
  });
});
