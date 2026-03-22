/**
 * Tests for provider-smart-actions-service.
 *
 * Function under contract:
 *  - getSmartActions(providerId: string, supabase: SupabaseClient): Promise<SmartAction[]>
 *
 * Strategy: mock the Supabase client's .from() chain at the builder level so
 * each table query can be controlled independently.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import type { SmartAction } from "../provider-smart-actions-service";
import { getSmartActions } from "../provider-smart-actions-service";

// ---------------------------------------------------------------------------
// Helpers to build mock Supabase query builders
// ---------------------------------------------------------------------------

/**
 * Returns a fluent query builder stub that resolves with the given response.
 * Supports: .select(), .eq(), .in(), .lt(), .gt(), .gte(), .lte(), .not(),
 *           .is(), .limit(), .order(), .single()
 */
function buildQueryStub(response: { data?: unknown; error?: unknown; count?: number }) {
  const stub = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(response),
    then: (resolve: (v: typeof response) => void) => Promise.resolve(response).then(resolve),
  };
  return stub;
}

/** Creates a mock Supabase client whose .from() returns different stubs per table. */
function buildMockClient(tableMap: Record<string, ReturnType<typeof buildQueryStub>>) {
  return {
    from: vi.fn((table: string) => tableMap[table] ?? buildQueryStub({ data: [], error: null })),
  } as unknown as import("@supabase/supabase-js").SupabaseClient;
}

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

const PROVIDER_ID = "prov-123";

const now = new Date();

function daysAgo(days: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function hoursFromNow(hours: number): string {
  const d = new Date(now);
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("getSmartActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── 1. Empty state ────────────────────────────────────────────────────────

  it("returns an empty array when there are no pending items", async () => {
    const client = buildMockClient({
      service_requests: buildQueryStub({ data: [], error: null }),
      provider_invoices: buildQueryStub({ data: [], error: null }),
      bookings: buildQueryStub({ data: [], error: null }),
      quotes: buildQueryStub({ data: [], error: null }),
      certificates: buildQueryStub({ data: [], error: null }),
    });

    const actions = await getSmartActions(PROVIDER_ID, client);
    expect(actions).toEqual([]);
  });

  // ── 2. Expiring leads (priority 10) ──────────────────────────────────────

  it("returns an expiring_lead action with priority 10", async () => {
    const expiringLead = {
      id: "sr-001",
      status: "open",
      created_at: daysAgo(1),
      expires_at: hoursFromNow(6), // within 12 hours
      category: "Plumbing",
    };

    // Two separate stubs for the two service_request queries (expiring + unanswered)
    let serviceRequestCallCount = 0;
    const serviceRequestStub = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      limit: vi.fn().mockImplementation(function () {
        serviceRequestCallCount++;
        // First call = expiring leads, return data; second = unanswered, return empty
        return Promise.resolve(
          serviceRequestCallCount === 1
            ? { data: [expiringLead], error: null }
            : { data: [], error: null },
        );
      }),
      order: vi.fn().mockReturnThis(),
    };

    const client = buildMockClient({
      service_requests: serviceRequestStub as ReturnType<typeof buildQueryStub>,
      provider_invoices: buildQueryStub({ data: [], error: null }),
      bookings: buildQueryStub({ data: [], error: null }),
      quotes: buildQueryStub({ data: [], error: null }),
      certificates: buildQueryStub({ data: [], error: null }),
    });

    const actions = await getSmartActions(PROVIDER_ID, client);
    const leadAction = actions.find((a) => a.type === "expiring_lead");

    expect(leadAction).toBeDefined();
    expect(leadAction?.priority).toBe(10);
    expect(leadAction?.href).toBe("/dashboard/provider/jobs/leads");
    expect(leadAction?.title).toContain("expiring");
  });

  // ── 3. Overdue invoices (priority 9) ─────────────────────────────────────

  it("returns an overdue_invoice action with priority 9", async () => {
    const overdueInvoice = {
      id: "inv-001",
      status: "overdue",
      provider_id: PROVIDER_ID,
      total_amount: 250.0,
    };

    const client = buildMockClient({
      service_requests: buildQueryStub({ data: [], error: null }),
      provider_invoices: buildQueryStub({ data: [overdueInvoice], error: null }),
      bookings: buildQueryStub({ data: [], error: null }),
      quotes: buildQueryStub({ data: [], error: null }),
      certificates: buildQueryStub({ data: [], error: null }),
    });

    const actions = await getSmartActions(PROVIDER_ID, client);
    const invoiceAction = actions.find((a) => a.type === "overdue_invoice");

    expect(invoiceAction).toBeDefined();
    expect(invoiceAction?.priority).toBe(9);
    expect(invoiceAction?.href).toBe("/dashboard/provider/payments");
    expect(invoiceAction?.title).toMatch(/overdue|invoice/i);
  });

  // ── 4. Max 5 actions, sorted by priority DESC ─────────────────────────────

  it("returns at most 5 actions sorted by priority descending", async () => {
    // Populate every action type with data
    const openLead = { id: "sr-1", status: "open", expires_at: hoursFromNow(6), category: "Plumbing" };
    const openLeadUnanswered = { id: "sr-2", status: "open", expires_at: hoursFromNow(48), category: "Electrical" };
    const overdueInv = { id: "inv-1", status: "overdue", provider_id: PROVIDER_ID, total_amount: 100 };
    const staleJob = {
      id: "bk-1",
      status: "in_progress",
      created_at: daysAgo(10),
      provider_id: PROVIDER_ID,
    };
    const completedJobMissingCert = {
      id: "bk-2",
      status: "completed",
      created_at: daysAgo(5),
      provider_id: PROVIDER_ID,
    };
    const completedJobForReview = {
      id: "bk-3",
      status: "completed",
      created_at: daysAgo(4),
      provider_id: PROVIDER_ID,
    };
    const acceptedQuote = { id: "q-1", status: "accepted", provider_id: PROVIDER_ID, booking_id: null };

    let serviceRequestCallCount = 0;
    const serviceRequestStub = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      limit: vi.fn().mockImplementation(function () {
        serviceRequestCallCount++;
        return Promise.resolve(
          serviceRequestCallCount === 1
            ? { data: [openLead], error: null }
            : { data: [openLeadUnanswered], error: null },
        );
      }),
      order: vi.fn().mockReturnThis(),
    };

    let bookingCallCount = 0;
    const bookingStub = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      limit: vi.fn().mockImplementation(function () {
        bookingCallCount++;
        if (bookingCallCount === 1) return Promise.resolve({ data: [staleJob], error: null });
        if (bookingCallCount === 2) return Promise.resolve({ data: [completedJobMissingCert], error: null });
        return Promise.resolve({ data: [completedJobForReview], error: null });
      }),
      order: vi.fn().mockReturnThis(),
    };

    const client = buildMockClient({
      service_requests: serviceRequestStub as ReturnType<typeof buildQueryStub>,
      provider_invoices: buildQueryStub({ data: [overdueInv], error: null }),
      bookings: bookingStub as ReturnType<typeof buildQueryStub>,
      quotes: buildQueryStub({ data: [acceptedQuote], error: null }),
      certificates: buildQueryStub({ data: [], error: null }),
    });

    const actions = await getSmartActions(PROVIDER_ID, client);

    expect(actions.length).toBeLessThanOrEqual(5);
    // Verify descending priority order
    for (let i = 1; i < actions.length; i++) {
      expect(actions[i - 1].priority).toBeGreaterThanOrEqual(actions[i].priority);
    }
  });

  // ── 5. Graceful failure: all queries fail ─────────────────────────────────

  it("returns an empty array when all queries fail", async () => {
    const errorStub = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      limit: vi.fn().mockRejectedValue(new Error("DB connection failed")),
      order: vi.fn().mockReturnThis(),
    };

    const client = {
      from: vi.fn(() => errorStub),
    } as unknown as import("@supabase/supabase-js").SupabaseClient;

    const actions = await getSmartActions(PROVIDER_ID, client);
    expect(actions).toEqual([]);
  });

  // ── 6. Correct hrefs per action type ─────────────────────────────────────

  it("includes the correct href for overdue_invoice and stale_job action types", async () => {
    const overdueInv = { id: "inv-1", status: "overdue", provider_id: PROVIDER_ID, total_amount: 75 };
    const staleJob = {
      id: "bk-10",
      status: "in_progress",
      created_at: daysAgo(8),
      provider_id: PROVIDER_ID,
    };

    let bookingCallCount2 = 0;
    const bookingStub2 = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      limit: vi.fn().mockImplementation(function () {
        bookingCallCount2++;
        if (bookingCallCount2 === 1) return Promise.resolve({ data: [staleJob], error: null });
        return Promise.resolve({ data: [], error: null });
      }),
      order: vi.fn().mockReturnThis(),
    };

    const client = buildMockClient({
      service_requests: buildQueryStub({ data: [], error: null }),
      provider_invoices: buildQueryStub({ data: [overdueInv], error: null }),
      bookings: bookingStub2 as ReturnType<typeof buildQueryStub>,
      quotes: buildQueryStub({ data: [], error: null }),
      certificates: buildQueryStub({ data: [], error: null }),
    });

    const actions = await getSmartActions(PROVIDER_ID, client);

    const invoiceAction = actions.find((a) => a.type === "overdue_invoice");
    const staleAction = actions.find((a) => a.type === "stale_job");

    expect(invoiceAction?.href).toBe("/dashboard/provider/payments");
    expect(staleAction?.href).toBe("/dashboard/provider/jobs/active");
  });
});
