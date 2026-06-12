/**
 * Tests for truedeed invoice-service (TDD RED — service not yet implemented)
 *
 * Pins the contract of @/services/truedeed/invoice-service per
 * docs/truedeed/billing-flow-gocardless.md §1–§2 / §5 (`billing:create-invoice`).
 *
 * CONTRACT DECISIONS pinned here (GREEN authors — service AND migration — must
 * follow):
 *  - Candidate approved→invoiced flips via rpc 'review_invoice_candidate'
 *    with p_new_status: 'invoiced'. The candidate-status migration MUST extend
 *    its transition lattice with approved→invoiced (it is not in the review
 *    lattice today); the direct-update guard on invoice_candidates stays.
 *  - Invoice money columns: net_pence 24900 / vat_pence 4980 / gross_pence
 *    29880 (£249 + £49.80 VAT, doc §2.1). due_at = issued + 14 calendar days
 *    (clause 8.1), pinned as an exact ISO timestamp under fake timers.
 *  - org_agent_id comes from candidate → introduction.agent_id; the Bacs
 *    mandate is read from agent_agency_profiles.gocardless_mandate_id (the
 *    doc's member_orgs.mandate_id maps onto agent_agency_profiles here).
 *  - GoCardless payment: gcRequest('/payments', { body: { payments: {
 *    amount: 29880, currency: 'GBP', charge_date: due date, links: {
 *    mandate } } }, idempotencyKey: <invoice id> }); the returned payment id
 *    is stored on invoices.gocardless_payment_id. When GoCardless is NOT
 *    configured the invoice is still created and an invoice_events row
 *    'gc_not_configured' is written instead (no gcRequest).
 *  - Invoice state transitions go through rpc 'transition_invoice'
 *    (dunning-machine events: payment_confirmed / payment_failed /
 *    charged_back) — never direct updates (invoices.state is guarded).
 *  - recordChargeback(gcPaymentId): transition charged_back + invoice_events
 *    + audit row, NO inngest event and NO billing suspension — a chargeback
 *    freezes auto-collection only (doc §1 chargebacks, clause 8.6); recovery
 *    is the ops/dispute path.
 *  - Inngest events: 'truedeed/invoice.created' { invoiceId } (email 0
 *    consumer), 'truedeed/invoice.paid' (reinstatement + email 5),
 *    'truedeed/invoice.payment-failed' (email 1).
 *  - Services never throw: null / { ok: false, reason } on failure.
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

vi.mock("@/lib/truedeed/gocardless-client", () => ({
  GoCardlessConfigError: class GoCardlessConfigError extends Error {},
  isGoCardlessConfigured: vi.fn(),
  gcRequest: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { inngest } from "@/inngest/client";
import {
  isGoCardlessConfigured,
  gcRequest,
} from "@/lib/truedeed/gocardless-client";
import {
  createInvoiceFromCandidate,
  recordPaymentConfirmed,
  recordPaymentFailed,
  recordChargeback,
} from "@/services/truedeed/invoice-service";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const CANDIDATE_ID = "44444444-0000-4000-8000-00000000000d";
const INTRO_ID = "eeeeeeee-0000-4000-8000-000000000005";
const AGENT_ID = "aaaaaaaa-0000-4000-8000-000000000001";
const INVOICE_ID = "77777777-0000-4000-8000-000000000010";
const EXISTING_INVOICE_ID = "88888888-0000-4000-8000-000000000011";
const MANDATE_ID = "MD_synthetic_123"; // synthetic GoCardless mandate id
const GC_PAYMENT_ID = "PM_synthetic_123"; // synthetic GoCardless payment id

const NOW = new Date("2026-06-12T10:00:00.000Z");
/** Issued + 14 calendar days (clause 8.1), exact under fake timers. */
const DUE_AT_ISO = "2026-06-26T10:00:00.000Z";

/** Approved candidate with the introduction embed carrying the agent. */
const APPROVED_CANDIDATE = {
  id: CANDIDATE_ID,
  status: "approved",
  source: "agent_report",
  introduction_id: INTRO_ID,
  introduction: { id: INTRO_ID, agent_id: AGENT_ID },
};

type DbResult = { data: unknown; error: unknown };
const ok = (data: unknown = null): DbResult => ({ data, error: null });

/**
 * Chainable per-table mock (pattern from ppd-match-service.test.ts), extended
 * with an `update` op for storing the GoCardless payment id.
 */
type OpResults = Partial<
  Record<"insert" | "select" | "update", DbResult | DbResult[]>
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
  chain.insert = vi.fn(() => {
    op = "insert";
    return chain;
  });
  chain.update = vi.fn(() => {
    op = "update";
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
  candidateSelect?: DbResult;
  invoicesSelect?: DbResult;
  invoicesInsert?: DbResult;
  profileSelect?: DbResult;
}) {
  const candidates = createTableChain({
    select: overrides?.candidateSelect ?? ok(APPROVED_CANDIDATE),
  });
  const invoices = createTableChain({
    // existing-invoice check (none by default) then insert returning the row
    select: overrides?.invoicesSelect ?? ok(null),
    insert: overrides?.invoicesInsert ?? ok({ id: INVOICE_ID }),
    update: ok(),
  });
  const profiles = createTableChain({
    select:
      overrides?.profileSelect ?? ok({ gocardless_mandate_id: MANDATE_ID }),
  });
  const invoiceEvents = createTableChain({ insert: ok() });
  const auditLog = createTableChain({ insert: ok() });

  const from = vi.fn((table: string) => {
    switch (table) {
      case "invoice_candidates":
        return candidates;
      case "invoices":
        return invoices;
      case "agent_agency_profiles":
        return profiles;
      case "invoice_events":
        return invoiceEvents;
      case "truedeed_audit_log":
        return auditLog;
      default:
        return createTableChain({});
    }
  });

  const rpc = vi.fn().mockResolvedValue(ok());
  const supabase = { from, rpc };
  return { supabase, from, rpc, candidates, invoices, profiles, invoiceEvents, auditLog };
}

function arm(mock: ReturnType<typeof createSupabaseMock>) {
  vi.mocked(createAdminClient).mockReturnValue(mock.supabase as never);
  return mock;
}

const findRpcCall = (
  rpc: ReturnType<typeof vi.fn>,
  name: string,
): unknown[] | undefined => rpc.mock.calls.find((c) => c[0] === name);

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ["Date"], now: NOW });
  vi.mocked(inngest.send).mockResolvedValue(undefined as never);
  vi.mocked(isGoCardlessConfigured).mockReturnValue(true);
  vi.mocked(gcRequest).mockResolvedValue({
    payments: { id: GC_PAYMENT_ID, status: "pending_submission" },
  } as never);
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// 1. createInvoiceFromCandidate — gates & idempotency
// ---------------------------------------------------------------------------

describe("createInvoiceFromCandidate — gates & idempotency", () => {
  it("returns { ok: false, reason: 'not_approved' } when the candidate is not approved; nothing is written", async () => {
    // Arrange
    const { invoices, rpc } = arm(
      createSupabaseMock({
        candidateSelect: ok({ ...APPROVED_CANDIDATE, status: "pending_review" }),
      }),
    );

    // Act
    const result = await createInvoiceFromCandidate(CANDIDATE_ID);

    // Assert
    expect(result).toEqual(
      expect.objectContaining({ ok: false, reason: "not_approved" }),
    );
    expect(invoices.insert).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
    expect(gcRequest).not.toHaveBeenCalled();
  });

  it("is idempotent: an existing invoice for the candidate → { ok: true, invoiceId: existing, created: false } with no new writes", async () => {
    // Arrange
    const { invoices, rpc } = arm(
      createSupabaseMock({
        invoicesSelect: ok({ id: EXISTING_INVOICE_ID }),
      }),
    );

    // Act
    const result = await createInvoiceFromCandidate(CANDIDATE_ID);

    // Assert
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        invoiceId: EXISTING_INVOICE_ID,
        created: false,
      }),
    );
    expect(invoices.insert).not.toHaveBeenCalled();
    expect(gcRequest).not.toHaveBeenCalled();
    expect(findRpcCall(rpc, "review_invoice_candidate")).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 2. createInvoiceFromCandidate — the VAT invoice row
// ---------------------------------------------------------------------------

describe("createInvoiceFromCandidate — invoice row", () => {
  it("inserts the Success Fee VAT invoice: net 24900 / vat 4980 / gross 29880, linked to candidate, introduction and the introducing agent", async () => {
    // Arrange
    const { invoices } = arm(createSupabaseMock());

    // Act
    const result = await createInvoiceFromCandidate(CANDIDATE_ID);

    // Assert — doc §2.1: £249.00 + £49.80 VAT = £298.80
    expect(invoices.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        net_pence: 24900,
        vat_pence: 4980,
        gross_pence: 29880,
        invoice_candidate_id: CANDIDATE_ID,
        introduction_id: INTRO_ID,
        org_agent_id: AGENT_ID,
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({ ok: true, invoiceId: INVOICE_ID, created: true }),
    );
  });

  it("pins due_at = issue date + 14 calendar days (clause 8.1) as an exact ISO timestamp", async () => {
    // Arrange
    const { invoices } = arm(createSupabaseMock());

    // Act
    await createInvoiceFromCandidate(CANDIDATE_ID);

    // Assert — fake timers: 2026-06-12T10:00Z + 14d
    const payload = invoices.insert.mock.calls[0][0] as { due_at: string };
    expect(payload.due_at).toBe(DUE_AT_ISO);
  });

  it("flips the candidate approved→invoiced via rpc 'review_invoice_candidate' with p_new_status 'invoiced' (migration must extend the lattice)", async () => {
    // Arrange
    const { rpc } = arm(createSupabaseMock());

    // Act
    await createInvoiceFromCandidate(CANDIDATE_ID);

    // Assert
    const call = findRpcCall(rpc, "review_invoice_candidate");
    expect(call).toBeDefined();
    expect(call![1]).toEqual(
      expect.objectContaining({ p_new_status: "invoiced" }),
    );
    expect(JSON.stringify(call![1])).toContain(CANDIDATE_ID);
  });
});

// ---------------------------------------------------------------------------
// 3. createInvoiceFromCandidate — GoCardless payment
// ---------------------------------------------------------------------------

describe("createInvoiceFromCandidate — GoCardless payment", () => {
  it("creates the GC payment: gcRequest('/payments') with amount 29880 GBP, charge_date = due date, links.mandate from agent_agency_profiles, idempotencyKey = invoice id", async () => {
    // Arrange
    arm(createSupabaseMock());

    // Act
    await createInvoiceFromCandidate(CANDIDATE_ID);

    // Assert — doc §2.3: charge_date = due_date; GC sends advance notice
    expect(gcRequest).toHaveBeenCalledWith(
      "/payments",
      expect.objectContaining({
        body: {
          payments: expect.objectContaining({
            amount: 29880,
            currency: "GBP",
            charge_date: expect.stringContaining("2026-06-26"),
            links: { mandate: MANDATE_ID },
          }),
        },
        idempotencyKey: INVOICE_ID,
      }),
    );
  });

  it("stores the returned payment id on invoices.gocardless_payment_id", async () => {
    // Arrange
    const { invoices } = arm(createSupabaseMock());

    // Act
    await createInvoiceFromCandidate(CANDIDATE_ID);

    // Assert
    expect(invoices.update).toHaveBeenCalledWith(
      expect.objectContaining({ gocardless_payment_id: GC_PAYMENT_ID }),
    );
  });

  it("when GoCardless is NOT configured: invoice still created ok, NO gcRequest, and an invoice_events row 'gc_not_configured' is written", async () => {
    // Arrange
    vi.mocked(isGoCardlessConfigured).mockReturnValue(false);
    const { invoices, invoiceEvents } = arm(createSupabaseMock());

    // Act
    const result = await createInvoiceFromCandidate(CANDIDATE_ID);

    // Assert
    expect(result).toEqual(
      expect.objectContaining({ ok: true, invoiceId: INVOICE_ID }),
    );
    expect(invoices.insert).toHaveBeenCalledTimes(1);
    expect(gcRequest).not.toHaveBeenCalled();
    expect(invoiceEvents.insert).toHaveBeenCalledWith(
      expect.objectContaining({ event: "gc_not_configured" }),
    );
  });
});

// ---------------------------------------------------------------------------
// 4. createInvoiceFromCandidate — events, audit, failure mode
// ---------------------------------------------------------------------------

describe("createInvoiceFromCandidate — events & failure mode", () => {
  it("emits inngest 'truedeed/invoice.created' { invoiceId } (email 0 consumer) and inserts a truedeed_audit_log row", async () => {
    // Arrange
    const { auditLog } = arm(createSupabaseMock());

    // Act
    await createInvoiceFromCandidate(CANDIDATE_ID);

    // Assert
    expect(inngest.send).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "truedeed/invoice.created",
        data: expect.objectContaining({ invoiceId: INVOICE_ID }),
      }),
    );
    expect(auditLog.insert).toHaveBeenCalledTimes(1);
  });

  it("never throws: top-level failure (createAdminClient throws) resolves null with no inngest event", async () => {
    // Arrange
    vi.mocked(createAdminClient).mockImplementation(() => {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");
    });

    // Act + Assert
    await expect(createInvoiceFromCandidate(CANDIDATE_ID)).resolves.toBeNull();
    expect(inngest.send).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 5. recordPaymentConfirmed / recordPaymentFailed / recordChargeback
// ---------------------------------------------------------------------------

describe("recordPaymentConfirmed", () => {
  it("finds the invoice by gocardless_payment_id, transitions via rpc 'transition_invoice' payment_confirmed and emits 'truedeed/invoice.paid' { invoiceId }", async () => {
    // Arrange
    const { invoices, rpc } = arm(
      createSupabaseMock({ invoicesSelect: ok({ id: INVOICE_ID }) }),
    );

    // Act
    const result = await recordPaymentConfirmed(GC_PAYMENT_ID);

    // Assert
    expect(result).toBe(true);
    expect(invoices.eq).toHaveBeenCalledWith(
      "gocardless_payment_id",
      GC_PAYMENT_ID,
    );
    const call = findRpcCall(rpc, "transition_invoice");
    expect(call).toBeDefined();
    expect(JSON.stringify(call![1])).toContain("payment_confirmed");
    expect(JSON.stringify(call![1])).toContain(INVOICE_ID);
    expect(inngest.send).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "truedeed/invoice.paid",
        data: expect.objectContaining({ invoiceId: INVOICE_ID }),
      }),
    );
  });

  it("returns false for an unknown payment id: no transition, no event", async () => {
    // Arrange
    const { rpc } = arm(createSupabaseMock({ invoicesSelect: ok(null) }));

    // Act + Assert
    await expect(recordPaymentConfirmed("PM_unknown")).resolves.toBe(false);
    expect(rpc).not.toHaveBeenCalled();
    expect(inngest.send).not.toHaveBeenCalled();
  });
});

describe("recordPaymentFailed", () => {
  it("transitions payment_failed and emits 'truedeed/invoice.payment-failed' { invoiceId } (email 1 consumer)", async () => {
    // Arrange
    const { rpc } = arm(
      createSupabaseMock({ invoicesSelect: ok({ id: INVOICE_ID }) }),
    );

    // Act
    const result = await recordPaymentFailed(GC_PAYMENT_ID);

    // Assert
    expect(result).toBe(true);
    const call = findRpcCall(rpc, "transition_invoice");
    expect(call).toBeDefined();
    expect(JSON.stringify(call![1])).toContain("payment_failed");
    expect(inngest.send).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "truedeed/invoice.payment-failed",
        data: expect.objectContaining({ invoiceId: INVOICE_ID }),
      }),
    );
  });
});

describe("recordChargeback", () => {
  it("transitions charged_back + writes invoice_events and audit rows; NO inngest event, NO billing suspension (clause 8.6: freeze auto-collection only)", async () => {
    // Arrange
    const { rpc, invoiceEvents, auditLog } = arm(
      createSupabaseMock({ invoicesSelect: ok({ id: INVOICE_ID }) }),
    );

    // Act
    const result = await recordChargeback(GC_PAYMENT_ID);

    // Assert
    expect(result).toBe(true);
    const call = findRpcCall(rpc, "transition_invoice");
    expect(call).toBeDefined();
    expect(JSON.stringify(call![1])).toContain("charged_back");
    expect(invoiceEvents.insert).toHaveBeenCalledTimes(1);
    expect(auditLog.insert).toHaveBeenCalledTimes(1);
    // Ops-only path: no automated email, no suspension of the org
    expect(inngest.send).not.toHaveBeenCalled();
  });
});
