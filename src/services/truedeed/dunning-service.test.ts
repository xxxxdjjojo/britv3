/**
 * Tests for truedeed dunning-service (TDD RED — service not yet implemented)
 *
 * Pins the contract of @/services/truedeed/dunning-service per
 * docs/truedeed/billing-flow-gocardless.md §2 (timeline) and §5
 * (`dunning:tick`, `billing:suspend` / `billing:reinstate`).
 *
 * CONTRACT DECISIONS pinned here (GREEN authors must follow):
 *  - runDunningTick(now: Date) → { reminders, finalNotices, suspensions } | null
 *  - It selects invoices with state in ('overdue', 'final_notice') ONLY —
 *    'disputed' is never selected (§2 dispute pause: clock frozen per invoice).
 *  - daysOverdue is computed from invoices.due_at against the `now` argument.
 *  - Thresholds come from DUNNING_DAYS in @/lib/truedeed/dunning-machine —
 *    pinned by mocking NON-SPEC values (REMINDER 9 / FINAL_NOTICE 16 /
 *    SUSPEND 23) so a service hardcoding the spec numbers (7/14/21) fails.
 *      day >= SUSPEND      & final_notice → rpc 'transition_invoice' day_tick
 *                                           + inngest 'truedeed/invoice.suspended'
 *      day >= FINAL_NOTICE & overdue      → rpc transition
 *                                           + inngest 'truedeed/invoice.final-notice'
 *      day >= REMINDER     & overdue      → NO state change; inngest
 *                                           'truedeed/invoice.reminder' +
 *                                           invoice_events row named by
 *                                           emailForTransition (delegated, not
 *                                           hardcoded) — idempotent: an existing
 *                                           'email_2_reminder' invoice_event
 *                                           (embedded on the selected row) skips.
 *  - Per-invoice errors are isolated: the batch continues; failed invoices are
 *    simply not counted.
 *  - suspendOrgBilling(agentId) / reinstateOrgBilling(agentId): set / clear
 *    agent_agency_profiles.billing_suspended_at, insert a truedeed_audit_log
 *    row, and emit inngest 'truedeed/billing.suspension-changed'
 *    { agentId, suspended }.
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

// Thresholds deliberately differ from the spec values (7/14/21) so a service
// that hardcodes the doc's numbers — instead of importing DUNNING_DAYS — fails.
vi.mock("@/lib/truedeed/dunning-machine", () => ({
  DUNNING_DAYS: { REMINDER: 9, FINAL_NOTICE: 16, SUSPEND: 23 },
  nextState: vi.fn(),
  emailForTransition: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { inngest } from "@/inngest/client";
import { emailForTransition } from "@/lib/truedeed/dunning-machine";
import {
  runDunningTick,
  suspendOrgBilling,
  reinstateOrgBilling,
} from "@/services/truedeed/dunning-service";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const INVOICE_ID = "77777777-0000-4000-8000-000000000010";
const SECOND_INVOICE_ID = "99999999-0000-4000-8000-000000000012";
const AGENT_ID = "aaaaaaaa-0000-4000-8000-000000000001";

const NOW = new Date("2026-06-12T10:00:00.000Z");
const DAY_MS = 24 * 60 * 60 * 1000;

/** due_at exactly n days before NOW. */
const dueDaysAgo = (n: number): string =>
  new Date(NOW.getTime() - n * DAY_MS).toISOString();

type InvoiceRow = {
  id: string;
  state: string;
  due_at: string;
  org_agent_id: string;
  invoice_events: Array<{ event: string }>;
};

const makeInvoice = (overrides: Partial<InvoiceRow> = {}): InvoiceRow => ({
  id: INVOICE_ID,
  state: "overdue",
  due_at: dueDaysAgo(10),
  org_agent_id: AGENT_ID,
  invoice_events: [],
  ...overrides,
});

type DbResult = { data: unknown; error: unknown };
const ok = (data: unknown = null): DbResult => ({ data, error: null });

/** Chainable per-table mock (pattern from ppd-match-service.test.ts). */
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
  for (const method of ["eq", "match", "order", "limit", "is", "in", "neq"]) {
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

function createSupabaseMock(rows: InvoiceRow[] = []) {
  const invoices = createTableChain({ select: ok(rows) });
  const invoiceEvents = createTableChain({ insert: ok() });
  const profiles = createTableChain({ update: ok() });
  const auditLog = createTableChain({ insert: ok() });

  const from = vi.fn((table: string) => {
    switch (table) {
      case "invoices":
        return invoices;
      case "invoice_events":
        return invoiceEvents;
      case "agent_agency_profiles":
        return profiles;
      case "truedeed_audit_log":
        return auditLog;
      default:
        return createTableChain({});
    }
  });

  const rpc = vi.fn().mockResolvedValue(ok());
  const supabase = { from, rpc };
  return { supabase, from, rpc, invoices, invoiceEvents, profiles, auditLog };
}

function arm(mock: ReturnType<typeof createSupabaseMock>) {
  vi.mocked(createAdminClient).mockReturnValue(mock.supabase as never);
  return mock;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ["Date"], now: NOW });
  vi.mocked(inngest.send).mockResolvedValue(undefined as never);
  vi.mocked(emailForTransition).mockReturnValue("email_2_reminder" as never);
});

afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// 1. Selection
// ---------------------------------------------------------------------------

describe("runDunningTick — selection", () => {
  it("selects invoices with state in ('overdue', 'final_notice') only — disputed clocks stay frozen", async () => {
    // Arrange
    const { from, invoices } = arm(createSupabaseMock([]));

    // Act
    await runDunningTick(NOW);

    // Assert
    expect(from).toHaveBeenCalledWith("invoices");
    expect(invoices.in).toHaveBeenCalledWith(
      "state",
      expect.arrayContaining(["overdue", "final_notice"]),
    );
    const states = invoices.in.mock.calls[0][1] as string[];
    expect(states).not.toContain("disputed");
  });
});

// ---------------------------------------------------------------------------
// 2. Suspension (day >= DUNNING_DAYS.SUSPEND, final_notice)
// ---------------------------------------------------------------------------

describe("runDunningTick — suspension", () => {
  it("final_notice at day >= SUSPEND → rpc 'transition_invoice' day_tick + inngest 'truedeed/invoice.suspended', counted in suspensions", async () => {
    // Arrange — 24 >= mocked SUSPEND 23
    const { rpc } = arm(
      createSupabaseMock([
        makeInvoice({ state: "final_notice", due_at: dueDaysAgo(24) }),
      ]),
    );

    // Act
    const result = await runDunningTick(NOW);

    // Assert
    const call = rpc.mock.calls.find((c) => c[0] === "transition_invoice");
    expect(call).toBeDefined();
    expect(JSON.stringify(call![1])).toContain(INVOICE_ID);
    expect(JSON.stringify(call![1])).toContain("day_tick");
    expect(inngest.send).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "truedeed/invoice.suspended",
        data: expect.objectContaining({ invoiceId: INVOICE_ID }),
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({ suspensions: 1, finalNotices: 0, reminders: 0 }),
    );
  });

  it("final_notice at day 22 (>= the spec's 21 but < the mocked SUSPEND 23) → no transition, no event — pins the CONSTANT", async () => {
    // Arrange — a service hardcoding 21 would suspend this invoice
    const { rpc } = arm(
      createSupabaseMock([
        makeInvoice({ state: "final_notice", due_at: dueDaysAgo(22) }),
      ]),
    );

    // Act
    const result = await runDunningTick(NOW);

    // Assert
    expect(rpc).not.toHaveBeenCalled();
    expect(inngest.send).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({ suspensions: 0, finalNotices: 0, reminders: 0 }),
    );
  });
});

// ---------------------------------------------------------------------------
// 3. Final notice (day >= DUNNING_DAYS.FINAL_NOTICE, overdue)
// ---------------------------------------------------------------------------

describe("runDunningTick — final notice", () => {
  it("overdue at day >= FINAL_NOTICE → rpc transition + inngest 'truedeed/invoice.final-notice', counted in finalNotices", async () => {
    // Arrange — 17 >= mocked FINAL_NOTICE 16
    const { rpc } = arm(
      createSupabaseMock([makeInvoice({ due_at: dueDaysAgo(17) })]),
    );

    // Act
    const result = await runDunningTick(NOW);

    // Assert
    const call = rpc.mock.calls.find((c) => c[0] === "transition_invoice");
    expect(call).toBeDefined();
    expect(JSON.stringify(call![1])).toContain(INVOICE_ID);
    expect(inngest.send).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "truedeed/invoice.final-notice",
        data: expect.objectContaining({ invoiceId: INVOICE_ID }),
      }),
    );
    expect(inngest.send).not.toHaveBeenCalledWith(
      expect.objectContaining({ name: "truedeed/invoice.reminder" }),
    );
    expect(result).toEqual(expect.objectContaining({ finalNotices: 1 }));
  });
});

// ---------------------------------------------------------------------------
// 4. Reminder (day >= DUNNING_DAYS.REMINDER, overdue) — email-only, idempotent
// ---------------------------------------------------------------------------

describe("runDunningTick — reminder", () => {
  it("overdue at day >= REMINDER with no prior email_2 event → NO state transition; emits 'truedeed/invoice.reminder' and writes the invoice_events row named by emailForTransition", async () => {
    // Arrange — 10 >= mocked REMINDER 9, < FINAL_NOTICE 16
    const { rpc, invoiceEvents } = arm(
      createSupabaseMock([makeInvoice({ due_at: dueDaysAgo(10) })]),
    );

    // Act
    const result = await runDunningTick(NOW);

    // Assert — reminder is email-only (D+7 self-transition in the machine)
    expect(rpc).not.toHaveBeenCalled();
    expect(emailForTransition).toHaveBeenCalled();
    expect(inngest.send).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "truedeed/invoice.reminder",
        data: expect.objectContaining({ invoiceId: INVOICE_ID }),
      }),
    );
    expect(invoiceEvents.insert).toHaveBeenCalledWith(
      expect.objectContaining({ event: "email_2_reminder" }),
    );
    expect(result).toEqual(expect.objectContaining({ reminders: 1 }));
  });

  it("is idempotent per day: an existing 'email_2_reminder' invoice_event on the row → skipped entirely", async () => {
    // Arrange
    const { rpc, invoiceEvents } = arm(
      createSupabaseMock([
        makeInvoice({
          due_at: dueDaysAgo(10),
          invoice_events: [{ event: "email_2_reminder" }],
        }),
      ]),
    );

    // Act
    const result = await runDunningTick(NOW);

    // Assert
    expect(rpc).not.toHaveBeenCalled();
    expect(inngest.send).not.toHaveBeenCalled();
    expect(invoiceEvents.insert).not.toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining({ reminders: 0 }));
  });

  it("overdue at day 8 (>= the spec's 7 but < the mocked REMINDER 9) → nothing happens — pins the CONSTANT", async () => {
    // Arrange — a service hardcoding 7 would send a reminder
    const { rpc, invoiceEvents } = arm(
      createSupabaseMock([makeInvoice({ due_at: dueDaysAgo(8) })]),
    );

    // Act
    const result = await runDunningTick(NOW);

    // Assert
    expect(rpc).not.toHaveBeenCalled();
    expect(inngest.send).not.toHaveBeenCalled();
    expect(invoiceEvents.insert).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({ suspensions: 0, finalNotices: 0, reminders: 0 }),
    );
  });
});

// ---------------------------------------------------------------------------
// 5. Error isolation
// ---------------------------------------------------------------------------

describe("runDunningTick — error isolation", () => {
  it("a per-invoice rpc error does not abort the batch: the next invoice is still processed and counted", async () => {
    // Arrange — two suspendable invoices; the first transition fails
    const { rpc } = arm(
      createSupabaseMock([
        makeInvoice({ state: "final_notice", due_at: dueDaysAgo(24) }),
        makeInvoice({
          id: SECOND_INVOICE_ID,
          state: "final_notice",
          due_at: dueDaysAgo(25),
        }),
      ]),
    );
    rpc
      .mockResolvedValueOnce({ data: null, error: { message: "boom" } })
      .mockResolvedValue(ok());

    // Act
    const result = await runDunningTick(NOW);

    // Assert — only the second invoice suspended; batch did not abort
    expect(rpc).toHaveBeenCalledTimes(2);
    expect(result).toEqual(expect.objectContaining({ suspensions: 1 }));
    expect(inngest.send).toHaveBeenCalledTimes(1);
    expect(inngest.send).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "truedeed/invoice.suspended",
        data: expect.objectContaining({ invoiceId: SECOND_INVOICE_ID }),
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// 6. suspendOrgBilling / reinstateOrgBilling
// ---------------------------------------------------------------------------

describe("suspendOrgBilling / reinstateOrgBilling", () => {
  it("suspendOrgBilling sets agent_agency_profiles.billing_suspended_at for the agent + audit log + 'truedeed/billing.suspension-changed' { suspended: true }", async () => {
    // Arrange
    const { profiles, auditLog } = arm(createSupabaseMock());

    // Act
    const result = await suspendOrgBilling(AGENT_ID);

    // Assert
    expect(result).toBe(true);
    expect(profiles.update).toHaveBeenCalledWith(
      expect.objectContaining({ billing_suspended_at: expect.any(String) }),
    );
    expect(profiles.eq).toHaveBeenCalledWith(expect.any(String), AGENT_ID);
    expect(auditLog.insert).toHaveBeenCalledTimes(1);
    expect(inngest.send).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "truedeed/billing.suspension-changed",
        data: expect.objectContaining({ agentId: AGENT_ID, suspended: true }),
      }),
    );
  });

  it("reinstateOrgBilling clears billing_suspended_at (null) + audit log + 'truedeed/billing.suspension-changed' { suspended: false }", async () => {
    // Arrange
    const { profiles, auditLog } = arm(createSupabaseMock());

    // Act
    const result = await reinstateOrgBilling(AGENT_ID);

    // Assert
    expect(result).toBe(true);
    expect(profiles.update).toHaveBeenCalledWith(
      expect.objectContaining({ billing_suspended_at: null }),
    );
    expect(profiles.eq).toHaveBeenCalledWith(expect.any(String), AGENT_ID);
    expect(auditLog.insert).toHaveBeenCalledTimes(1);
    expect(inngest.send).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "truedeed/billing.suspension-changed",
        data: expect.objectContaining({ agentId: AGENT_ID, suspended: false }),
      }),
    );
  });
});
