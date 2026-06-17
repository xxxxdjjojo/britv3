/**
 * Tests for truedeed dispute-service (TDD RED — service not yet implemented)
 *
 * Pins the contract of @/services/truedeed/dispute-service:
 *
 *  1. raiseDispute({ invoiceId, raisedBy, grounds, files? })
 *     → { ok: true; disputeId; properlyRaised } | { ok: false; error }
 *
 *     Validation order (none of these uploads, inserts, or rpcs):
 *       'not_found'          invoice does not exist
 *       'not_authorised'     invoice.org_agent_id !== raisedBy
 *       'grounds_required'   grounds is empty / whitespace only
 *
 *     Window (clause 9.5): properly_raised = true when now <=
 *     addBusinessDays(invoice.issued_at, 10, holidays). Inside the window the
 *     service ALSO calls rpc 'transition_invoice' with 'dispute_raised'
 *     (pauses dunning); outside the window the row is recorded with
 *     properly_raised:false and NO transition happens (the dunning clock is
 *     not paused on a late dispute).
 *
 *     Evidence files (optional): each uploaded to the 'rebuttal-evidence'
 *     bucket with the SAME sanitiser as rebuttal-service — paths are
 *     '<disputeId-or-invoiceId>/<safe-name>' and cannot escape the folder
 *     via '..', backslashes, or control chars. (`files` may be omitted.)
 *
 *     Database errors:
 *       23505 on insert → 'already_disputed' (unique(invoice_id))
 *       any other insert error → 'insert_failed'
 *
 *     Side-effects (success only):
 *       - inngest 'truedeed/dispute.raised' { disputeId, invoiceId, properlyRaised }
 *       - truedeed_audit_log 'dispute_raised' row
 *       - returns { ok: true; disputeId; properlyRaised }
 *     Never throws.
 *
 *  2. resolveDispute({ disputeId, adminId, decision, category, reason }) → boolean
 *     - reason required + category required: empty → false BEFORE any rpc
 *     - rpc 'decide_invoice_dispute'
 *     - rpc error → false, no audit, no inngest
 *     - success → audit + inngest 'truedeed/dispute.resolved' { disputeId, decision }
 *     Never throws.
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

vi.mock("@/lib/business-days", () => ({
  getEnglandWalesBankHolidays: vi.fn().mockResolvedValue([]),
  addBusinessDays: (date: Date, days: number) => {
    // Deterministic test stub: skip Sat/Sun only, ignore holidays.
    const result = new Date(date.getTime());
    let remaining = days;
    while (remaining > 0) {
      result.setUTCDate(result.getUTCDate() + 1);
      const dow = result.getUTCDay();
      if (dow !== 0 && dow !== 6) remaining -= 1;
    }
    return result;
  },
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { inngest } from "@/inngest/client";
import {
  raiseDispute,
  resolveDispute,
} from "@/services/truedeed/dispute-service";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const INVOICE_ID = "eeeeeeee-5555-4000-8000-000000000101";
const STRANGER_INVOICE = "eeeeeeee-5555-4000-8000-000000000999";
const AGENT_ID = "aaaaaaaa-5555-4000-8000-000000000001";
const STRANGER_ID = "aaaaaaaa-5555-4000-8000-000000000002";
const ADMIN_ID = "cccccccc-5555-4000-8000-000000000001";
const DISPUTE_ID = "eeeeeeee-5555-4000-8000-000000000201";

const NOW = new Date("2026-06-12T10:00:00.000Z");
// Mon 2026-06-01 + 10 business days = Mon 2026-06-15 (Sat/Sun excluded).
const ISSUED_AT_WITHIN = "2026-06-01T09:00:00.000Z";
// Two months ago: well outside any 10-business-day window.
const ISSUED_AT_OUTSIDE = "2026-04-01T09:00:00.000Z";

const INVOICE_ROW_OK = {
  id: INVOICE_ID,
  org_agent_id: AGENT_ID,
  issued_at: ISSUED_AT_WITHIN,
};

type DbResult = { data: unknown; error: unknown };
const ok = (data: unknown = null): DbResult => ({ data, error: null });
const err = (error: unknown): DbResult => ({ data: null, error });

function makeFiles(count: number): File[] {
  return Array.from(
    { length: count },
    (_, i) =>
      new File([`synthetic evidence ${i}`], `evidence-${i}.pdf`, {
        type: "application/pdf",
      }),
  );
}

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
  invoiceSelect?: DbResult;
  disputeInsert?: DbResult;
  rpc?: DbResult;
}) {
  const invoices = createTableChain({
    select: overrides?.invoiceSelect ?? ok(INVOICE_ROW_OK),
  });
  const disputes = createTableChain({
    insert: overrides?.disputeInsert ?? ok({ id: DISPUTE_ID }),
  });
  const auditLog = createTableChain({ insert: ok() });

  const from = vi.fn((table: string) => {
    switch (table) {
      case "invoices":
        return invoices;
      case "invoice_disputes":
        return disputes;
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

  const rpc = vi.fn().mockResolvedValue(overrides?.rpc ?? ok());

  const supabase = { from, rpc, storage: { from: storageFrom } };
  return {
    supabase,
    from,
    rpc,
    invoices,
    disputes,
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
// 1. raiseDispute — validation errors
// ---------------------------------------------------------------------------

describe("raiseDispute — validation errors", () => {
  it("returns 'not_found' when the invoice does not exist, and uploads nothing", async () => {
    const { upload, disputes, rpc } = arm(
      createSupabaseMock({ invoiceSelect: ok(null) }),
    );

    const result = await raiseDispute({
      invoiceId: STRANGER_INVOICE,
      raisedBy: AGENT_ID,
      grounds: "Synthetic",
      files: makeFiles(1),
    });

    expect(result).toEqual({ ok: false, error: "not_found" });
    expect(upload).not.toHaveBeenCalled();
    expect(disputes.insert).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("returns 'not_authorised' when the invoice belongs to a different agent", async () => {
    const { upload, disputes } = arm(
      createSupabaseMock({
        invoiceSelect: ok({ ...INVOICE_ROW_OK, org_agent_id: STRANGER_ID }),
      }),
    );

    const result = await raiseDispute({
      invoiceId: INVOICE_ID,
      raisedBy: AGENT_ID,
      grounds: "Synthetic",
      files: makeFiles(1),
    });

    expect(result).toEqual({ ok: false, error: "not_authorised" });
    expect(upload).not.toHaveBeenCalled();
    expect(disputes.insert).not.toHaveBeenCalled();
  });

  it("returns 'grounds_required' when grounds is empty or only whitespace", async () => {
    const { upload, disputes } = arm(createSupabaseMock());

    for (const grounds of ["", "   ", "\n\t"]) {
      const result = await raiseDispute({
        invoiceId: INVOICE_ID,
        raisedBy: AGENT_ID,
        grounds,
        files: makeFiles(1),
      });
      expect(result).toEqual({ ok: false, error: "grounds_required" });
    }
    expect(upload).not.toHaveBeenCalled();
    expect(disputes.insert).not.toHaveBeenCalled();
  });

  it("returns 'already_disputed' when the insert raises a 23505 unique violation", async () => {
    arm(
      createSupabaseMock({
        disputeInsert: err({ code: "23505", message: "duplicate key" }),
      }),
    );

    const result = await raiseDispute({
      invoiceId: INVOICE_ID,
      raisedBy: AGENT_ID,
      grounds: "Synthetic",
      files: [],
    });

    expect(result).toEqual({ ok: false, error: "already_disputed" });
  });

  it("returns 'insert_failed' on a non-23505 insert error", async () => {
    arm(
      createSupabaseMock({
        disputeInsert: err({ code: "XX000", message: "boom" }),
      }),
    );

    const result = await raiseDispute({
      invoiceId: INVOICE_ID,
      raisedBy: AGENT_ID,
      grounds: "Synthetic",
      files: [],
    });

    expect(result).toEqual({ ok: false, error: "insert_failed" });
  });
});

// ---------------------------------------------------------------------------
// 2. raiseDispute — clause 9.5 window
// ---------------------------------------------------------------------------

describe("raiseDispute — clause 9.5 window", () => {
  it("INSIDE the 10-business-day window: properly_raised = true AND calls transition_invoice 'dispute_raised'", async () => {
    const { disputes, rpc } = arm(createSupabaseMock());

    const result = await raiseDispute({
      invoiceId: INVOICE_ID,
      raisedBy: AGENT_ID,
      grounds: "That buyer came from a portal, not you",
      files: [],
    });

    expect(result).toEqual({
      ok: true,
      disputeId: DISPUTE_ID,
      properlyRaised: true,
    });
    expect(disputes.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        invoice_id: INVOICE_ID,
        raised_by: AGENT_ID,
        grounds: "That buyer came from a portal, not you",
        properly_raised: true,
      }),
    );
    const transitionCall = rpc.mock.calls.find(
      (c) => c[0] === "transition_invoice",
    );
    expect(transitionCall).toBeDefined();
    expect(JSON.stringify(transitionCall![1])).toContain("dispute_raised");
  });

  it("OUTSIDE the window: properly_raised = false AND does NOT call transition_invoice (dunning clock keeps ticking)", async () => {
    const { rpc, disputes } = arm(
      createSupabaseMock({
        invoiceSelect: ok({ ...INVOICE_ROW_OK, issued_at: ISSUED_AT_OUTSIDE }),
      }),
    );

    const result = await raiseDispute({
      invoiceId: INVOICE_ID,
      raisedBy: AGENT_ID,
      grounds: "Late but real",
      files: [],
    });

    expect(result).toEqual({
      ok: true,
      disputeId: DISPUTE_ID,
      properlyRaised: false,
    });
    expect(disputes.insert).toHaveBeenCalledWith(
      expect.objectContaining({ properly_raised: false }),
    );
    expect(
      rpc.mock.calls.find((c) => c[0] === "transition_invoice"),
    ).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 3. raiseDispute — evidence upload (sanitiser + bucket)
// ---------------------------------------------------------------------------

describe("raiseDispute — evidence upload", () => {
  it("uploads each file to the 'rebuttal-evidence' bucket under the invoice id", async () => {
    const { storageFrom, upload } = arm(createSupabaseMock());

    await raiseDispute({
      invoiceId: INVOICE_ID,
      raisedBy: AGENT_ID,
      grounds: "Synthetic",
      files: makeFiles(2),
    });

    expect(storageFrom).toHaveBeenCalledWith("rebuttal-evidence");
    expect(upload).toHaveBeenCalledTimes(2);
    for (const call of upload.mock.calls) {
      expect(String(call[0])).toContain(INVOICE_ID);
    }
  });

  it("sanitises hostile filenames: '..', backslashes, control chars and leading dots cannot escape the invoice folder", async () => {
    const { upload } = arm(createSupabaseMock());

    const hostile = [
      new File(["x"], "../../other-invoice/escape.pdf", {
        type: "application/pdf",
      }),
      new File(["x"], "..\\windows\\esc ape%00.pdf", {
        type: "application/pdf",
      }),
      new File(["x"], "...hidden.pdf", { type: "application/pdf" }),
    ];

    const result = await raiseDispute({
      invoiceId: INVOICE_ID,
      raisedBy: AGENT_ID,
      grounds: "Synthetic",
      files: hostile,
    });

    expect(result.ok).toBe(true);
    expect(upload).toHaveBeenCalledTimes(3);
    for (const call of upload.mock.calls) {
      const path = String(call[0]);
      expect(path).toMatch(
        new RegExp(`^${INVOICE_ID}/[A-Za-z0-9_][A-Za-z0-9._-]*$`),
      );
      expect(path).not.toContain("..");
    }
  });

  it("optional files: omitting `files` records the dispute with empty evidence_storage_paths", async () => {
    const { upload, disputes } = arm(createSupabaseMock());

    const result = await raiseDispute({
      invoiceId: INVOICE_ID,
      raisedBy: AGENT_ID,
      grounds: "Synthetic",
    });

    expect(result.ok).toBe(true);
    expect(upload).not.toHaveBeenCalled();
    expect(disputes.insert).toHaveBeenCalledWith(
      expect.objectContaining({ evidence_storage_paths: [] }),
    );
  });
});

// ---------------------------------------------------------------------------
// 4. raiseDispute — side effects on success
// ---------------------------------------------------------------------------

describe("raiseDispute — side effects on success", () => {
  it("emits 'truedeed/dispute.raised' { disputeId, invoiceId, properlyRaised } and writes the audit log", async () => {
    const { auditLog } = arm(createSupabaseMock());

    await raiseDispute({
      invoiceId: INVOICE_ID,
      raisedBy: AGENT_ID,
      grounds: "Synthetic",
      files: [],
    });

    expect(vi.mocked(inngest.send)).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "truedeed/dispute.raised",
        data: expect.objectContaining({
          disputeId: DISPUTE_ID,
          invoiceId: INVOICE_ID,
          properlyRaised: true,
        }),
      }),
    );
    expect(auditLog.insert).toHaveBeenCalledTimes(1);
  });

  it("never throws when the inngest emit fails (resilient to broker outage)", async () => {
    arm(createSupabaseMock());
    vi.mocked(inngest.send).mockRejectedValueOnce(new Error("broker down"));

    await expect(
      raiseDispute({
        invoiceId: INVOICE_ID,
        raisedBy: AGENT_ID,
        grounds: "Synthetic",
        files: [],
      }),
    ).resolves.toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 5. resolveDispute
// ---------------------------------------------------------------------------

describe("resolveDispute", () => {
  it("returns false BEFORE any rpc when reason is empty", async () => {
    const { rpc } = arm(createSupabaseMock());

    const result = await resolveDispute({
      disputeId: DISPUTE_ID,
      adminId: ADMIN_ID,
      decision: "conceded",
      category: "D2_fell_through",
      reason: "",
    });

    expect(result).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("returns false BEFORE any rpc when category is empty / null", async () => {
    const { rpc } = arm(createSupabaseMock());

    const result = await resolveDispute({
      disputeId: DISPUTE_ID,
      adminId: ADMIN_ID,
      decision: "conceded",
      category: "",
      reason: "Valid reason",
    });

    expect(result).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("on success: calls rpc 'decide_invoice_dispute' with all params, audit-logs, emits inngest", async () => {
    const { rpc, auditLog } = arm(createSupabaseMock());

    const result = await resolveDispute({
      disputeId: DISPUTE_ID,
      adminId: ADMIN_ID,
      decision: "conceded",
      category: "D2_fell_through",
      reason: "Genuine fall-through (clause 7.2)",
    });

    expect(result).toBe(true);
    const decideCall = rpc.mock.calls.find(
      (c) => c[0] === "decide_invoice_dispute",
    );
    expect(decideCall).toBeDefined();
    const args = JSON.stringify(decideCall![1]);
    expect(args).toContain(DISPUTE_ID);
    expect(args).toContain(ADMIN_ID);
    expect(args).toContain("conceded");
    expect(args).toContain("D2_fell_through");
    expect(args).toContain("Genuine fall-through");

    expect(vi.mocked(inngest.send)).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "truedeed/dispute.resolved",
        data: expect.objectContaining({
          disputeId: DISPUTE_ID,
          decision: "conceded",
        }),
      }),
    );
    expect(auditLog.insert).toHaveBeenCalledTimes(1);
  });

  it("returns false and emits NO inngest event when the rpc errors", async () => {
    arm(createSupabaseMock({ rpc: err({ message: "boom" }) }));

    const result = await resolveDispute({
      disputeId: DISPUTE_ID,
      adminId: ADMIN_ID,
      decision: "rejected",
      category: "D1_source",
      reason: "Valid reason",
    });

    expect(result).toBe(false);
    expect(vi.mocked(inngest.send)).not.toHaveBeenCalledWith(
      expect.objectContaining({ name: "truedeed/dispute.resolved" }),
    );
  });
});
