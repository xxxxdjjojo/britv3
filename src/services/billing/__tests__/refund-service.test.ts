/**
 * Tests for refund-service — state machine coverage.
 *
 * State machine under test:
 *   createRequest:
 *     submitted → processed        (amount ≤ £100, Stripe succeeds)
 *     submitted → pending_review   (amount > £100)
 *     submitted → pending_review   (amount ≤ £100, Stripe fails → fallback)
 *     throws                       (charge outside 14-day window)
 *
 *   processRefund:
 *     pending_review → processed   (admin approve, Stripe succeeds)
 *     pending_review → approved    (admin approve, Stripe fails → webhook fallback)
 *     pending_review → rejected    (admin reject)
 *
 *   getRequest / listRequests — read paths via caller-supplied supabase client.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

// ---------------------------------------------------------------------------
// Stripe mock
// ---------------------------------------------------------------------------

const mockStripeInstance = {
  charges: {
    retrieve: vi.fn(),
  },
  refunds: {
    create: vi.fn(),
  },
};

vi.mock("@/lib/stripe", () => ({
  getStripe: () => mockStripeInstance,
}));

// ---------------------------------------------------------------------------
// Supabase admin mock — we need per-test control of each query's resolved value.
// The admin client is returned by createAdminClient(); we set up a single shared
// mock and re-configure chain results in each test via mockImplementation.
// ---------------------------------------------------------------------------

/** Shared chainable query builder. All methods return `this` except terminals. */
function makeBuilder(terminalResult: Record<string, unknown>) {
  const b: Record<string, unknown> = {};
  const chainable = [
    "select",
    "insert",
    "update",
    "delete",
    "eq",
    "neq",
    "order",
    "range",
    "limit",
    "offset",
  ];
  for (const m of chainable) {
    b[m] = vi.fn().mockReturnValue(b);
  }
  b["single"] = vi.fn().mockResolvedValue(terminalResult);
  b["maybeSingle"] = vi.fn().mockResolvedValue(terminalResult);
  // Allow the builder itself to be awaited (for non-single queries)
  b["then"] = vi.fn((resolve: (v: unknown) => void) => resolve(terminalResult));
  return b;
}

/** A from() factory that returns a fresh chainable builder for each call. */
type Builder = ReturnType<typeof makeBuilder>;

/** createAdminClient mock */
const mockAdminFrom = vi.fn();
const mockAdminClient = { from: mockAdminFrom };

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => mockAdminClient,
}));

// ---------------------------------------------------------------------------
// Helper factories
// ---------------------------------------------------------------------------

/** Build a realistic RefundRequest DB row. */
function makeDbRequest(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "rr_test_001",
    user_id: "user_abc",
    stripe_payment_intent_id: null,
    stripe_charge_id: "ch_test_123",
    amount_pence: 5000,
    reason: "Item not received",
    details: null,
    status: "submitted",
    admin_id: null,
    admin_notes: null,
    stripe_refund_id: null,
    processed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/** Return an epoch seconds timestamp N days ago. */
function daysAgoEpoch(days: number): number {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return Math.floor(d.getTime() / 1000);
}

// ---------------------------------------------------------------------------
// Import SUT after mocks are registered
// ---------------------------------------------------------------------------

import {
  createRequest,
  processRefund,
  getRequest,
  listRequests,
  REFUND_AUTO_APPROVE_LIMIT_PENCE,
  REFUND_WINDOW_DAYS,
} from "../refund-service";

// Minimal SupabaseClient stand-in for read functions that accept the caller's client.
const callerSupabase = { from: vi.fn() } as unknown as import("@supabase/supabase-js").SupabaseClient;

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("refund-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // createRequest
  // =========================================================================

  describe("createRequest", () => {
    it("auto-approves and returns processed status when amount ≤ £100", async () => {
      const dbRequest = makeDbRequest({ amount_pence: REFUND_AUTO_APPROVE_LIMIT_PENCE });

      // charges.retrieve — charge is fresh (1 day ago)
      mockStripeInstance.charges.retrieve.mockResolvedValue({
        id: "ch_test_123",
        created: daysAgoEpoch(1),
      });

      // refunds.create — Stripe succeeds
      mockStripeInstance.refunds.create.mockResolvedValue({
        id: "re_test_abc",
        status: "succeeded",
      });

      // Two from() calls:
      //   1. insert → single (returns submitted row)
      //   2. update → eq (no return needed — ignored)
      const insertBuilder: Builder = makeBuilder({ data: dbRequest, error: null });
      const updateBuilder: Builder = makeBuilder({ data: null, error: null });

      mockAdminFrom
        .mockReturnValueOnce(insertBuilder)  // insert
        .mockReturnValueOnce(updateBuilder); // update after Stripe refund

      const result = await createRequest(
        {} as import("@supabase/supabase-js").SupabaseClient,
        "user_abc",
        "ch_test_123",
        REFUND_AUTO_APPROVE_LIMIT_PENCE,
        "Item not received",
      );

      expect(result.status).toBe("processed");
      expect(result.stripe_refund_id).toBe("re_test_abc");
      expect(mockStripeInstance.refunds.create).toHaveBeenCalledWith({
        charge: "ch_test_123",
        amount: REFUND_AUTO_APPROVE_LIMIT_PENCE,
        reason: "requested_by_customer",
      });
    });

    it("routes to pending_review when amount > £100", async () => {
      const amountOver = REFUND_AUTO_APPROVE_LIMIT_PENCE + 1; // 10_001 pence
      const dbRequest = makeDbRequest({ amount_pence: amountOver, status: "submitted" });

      mockStripeInstance.charges.retrieve.mockResolvedValue({
        id: "ch_test_456",
        created: daysAgoEpoch(2),
      });

      const insertBuilder: Builder = makeBuilder({ data: dbRequest, error: null });
      const updateBuilder: Builder = makeBuilder({ data: null, error: null });

      mockAdminFrom
        .mockReturnValueOnce(insertBuilder)
        .mockReturnValueOnce(updateBuilder);

      const result = await createRequest(
        {} as import("@supabase/supabase-js").SupabaseClient,
        "user_abc",
        "ch_test_456",
        amountOver,
        "Wrong item delivered",
      );

      expect(result.status).toBe("pending_review");
      // Stripe refund should NOT have been attempted
      expect(mockStripeInstance.refunds.create).not.toHaveBeenCalled();
    });

    it("throws when charge is outside the 14-day refund window", async () => {
      // Charge is 15 days old — past the REFUND_WINDOW_DAYS limit
      mockStripeInstance.charges.retrieve.mockResolvedValue({
        id: "ch_old_789",
        created: daysAgoEpoch(REFUND_WINDOW_DAYS + 1),
      });

      await expect(
        createRequest(
          {} as import("@supabase/supabase-js").SupabaseClient,
          "user_abc",
          "ch_old_789",
          5000,
          "Changed my mind",
        ),
      ).rejects.toThrow(`Refund window expired`);

      // Nothing should have been inserted
      expect(mockAdminFrom).not.toHaveBeenCalled();
    });

    it("falls back to pending_review when Stripe refund fails for auto-approve amount", async () => {
      const dbRequest = makeDbRequest({ amount_pence: 500 }); // £5 — well under limit

      mockStripeInstance.charges.retrieve.mockResolvedValue({
        id: "ch_test_low",
        created: daysAgoEpoch(1),
      });

      // Stripe refund fails
      mockStripeInstance.refunds.create.mockRejectedValue(
        new Error("Your card was declined."),
      );

      const insertBuilder: Builder = makeBuilder({ data: dbRequest, error: null });
      const fallbackUpdateBuilder: Builder = makeBuilder({ data: null, error: null });

      mockAdminFrom
        .mockReturnValueOnce(insertBuilder)
        .mockReturnValueOnce(fallbackUpdateBuilder);

      const result = await createRequest(
        {} as import("@supabase/supabase-js").SupabaseClient,
        "user_abc",
        "ch_test_low",
        500,
        "Service not provided",
      );

      expect(result.status).toBe("pending_review");

      // Verify the fallback update was called with the failure note
      const updateCall = (fallbackUpdateBuilder.update as ReturnType<typeof vi.fn>).mock.calls[0][0] as Record<string, unknown>;
      expect(updateCall.status).toBe("pending_review");
      expect(String(updateCall.admin_notes)).toContain("Auto-approve Stripe call failed");
    });

    it("throws when insert fails", async () => {
      mockStripeInstance.charges.retrieve.mockResolvedValue({
        id: "ch_test_fail",
        created: daysAgoEpoch(1),
      });

      const failedInsertBuilder: Builder = makeBuilder({
        data: null,
        error: { message: "duplicate key value", code: "23505" },
      });

      mockAdminFrom.mockReturnValueOnce(failedInsertBuilder);

      await expect(
        createRequest(
          {} as import("@supabase/supabase-js").SupabaseClient,
          "user_abc",
          "ch_test_fail",
          5000,
          "Test reason",
        ),
      ).rejects.toThrow("Failed to create refund request");
    });
  });

  // =========================================================================
  // processRefund
  // =========================================================================

  describe("processRefund", () => {
    it("approves and returns processed status when Stripe succeeds", async () => {
      const existing = makeDbRequest({
        id: "rr_pending_001",
        status: "pending_review",
        stripe_charge_id: "ch_test_pending",
        amount_pence: 50000,
      });

      const processed = { ...existing, status: "processed", stripe_refund_id: "re_admin_001" };

      mockStripeInstance.refunds.create.mockResolvedValue({
        id: "re_admin_001",
        status: "succeeded",
      });

      // fetch existing + update to processed
      const fetchBuilder: Builder = makeBuilder({ data: existing, error: null });
      const updateBuilder: Builder = makeBuilder({ data: processed, error: null });

      mockAdminFrom
        .mockReturnValueOnce(fetchBuilder)  // select existing
        .mockReturnValueOnce(updateBuilder); // update to processed

      const result = await processRefund(
        {} as import("@supabase/supabase-js").SupabaseClient,
        "rr_pending_001",
        "admin_user_001",
        "approve",
        "Verified — refund approved",
      );

      expect(result.status).toBe("processed");
      expect(result.stripe_refund_id).toBe("re_admin_001");
      expect(mockStripeInstance.refunds.create).toHaveBeenCalledWith({
        charge: "ch_test_pending",
        amount: 50000,
        reason: "requested_by_customer",
      });
    });

    it("sets status to approved (not processed) when Stripe call fails during admin approve", async () => {
      const existing = makeDbRequest({
        id: "rr_pending_002",
        status: "pending_review",
        stripe_charge_id: "ch_test_pending2",
        amount_pence: 20000,
      });

      const approvedRow = { ...existing, status: "approved", admin_id: "admin_001" };

      mockStripeInstance.refunds.create.mockRejectedValue(
        new Error("Stripe is unavailable"),
      );

      const fetchBuilder: Builder = makeBuilder({ data: existing, error: null });
      const updateBuilder: Builder = makeBuilder({ data: approvedRow, error: null });

      mockAdminFrom
        .mockReturnValueOnce(fetchBuilder)
        .mockReturnValueOnce(updateBuilder);

      const result = await processRefund(
        {} as import("@supabase/supabase-js").SupabaseClient,
        "rr_pending_002",
        "admin_001",
        "approve",
      );

      // Falls back to "approved" — webhook will complete to "processed"
      expect(result.status).toBe("approved");

      const updateArg = (updateBuilder.update as ReturnType<typeof vi.fn>).mock.calls[0][0] as Record<string, unknown>;
      expect(updateArg.status).toBe("approved");
      expect(String(updateArg.admin_notes)).toContain("Stripe call failed");
    });

    it("rejects with admin notes and does not call Stripe", async () => {
      const existing = makeDbRequest({
        id: "rr_pending_003",
        status: "pending_review",
      });

      const rejectedRow = {
        ...existing,
        status: "rejected",
        admin_id: "admin_001",
        admin_notes: "Duplicate request — already refunded",
        processed_at: new Date().toISOString(),
      };

      const fetchBuilder: Builder = makeBuilder({ data: existing, error: null });
      const updateBuilder: Builder = makeBuilder({ data: rejectedRow, error: null });

      mockAdminFrom
        .mockReturnValueOnce(fetchBuilder)
        .mockReturnValueOnce(updateBuilder);

      const result = await processRefund(
        {} as import("@supabase/supabase-js").SupabaseClient,
        "rr_pending_003",
        "admin_001",
        "reject",
        "Duplicate request — already refunded",
      );

      expect(result.status).toBe("rejected");
      expect(result.admin_notes).toBe("Duplicate request — already refunded");
      // Stripe must NOT be called for rejections
      expect(mockStripeInstance.refunds.create).not.toHaveBeenCalled();
    });

    it("throws when refund request is not found", async () => {
      const fetchBuilder: Builder = makeBuilder({
        data: null,
        error: { message: "No rows returned", code: "PGRST116" },
      });

      mockAdminFrom.mockReturnValueOnce(fetchBuilder);

      await expect(
        processRefund(
          {} as import("@supabase/supabase-js").SupabaseClient,
          "rr_nonexistent",
          "admin_001",
          "approve",
        ),
      ).rejects.toThrow("Refund request not found");
    });
  });

  // =========================================================================
  // getRequest
  // =========================================================================

  describe("getRequest", () => {
    it("returns the refund request when found", async () => {
      const dbRequest = makeDbRequest({ id: "rr_get_001" });
      const builder: Builder = makeBuilder({ data: dbRequest, error: null });
      (callerSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue(builder);

      const result = await getRequest(callerSupabase, "rr_get_001");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("rr_get_001");
    });

    it("returns null when no matching request exists", async () => {
      const builder: Builder = makeBuilder({ data: null, error: null });
      (callerSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue(builder);

      const result = await getRequest(callerSupabase, "rr_missing");

      expect(result).toBeNull();
    });

    it("throws when supabase returns an error", async () => {
      const builder: Builder = makeBuilder({
        data: null,
        error: { message: "permission denied", code: "42501" },
      });
      (callerSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue(builder);

      await expect(getRequest(callerSupabase, "rr_error")).rejects.toThrow(
        "Failed to fetch refund request",
      );
    });
  });

  // =========================================================================
  // listRequests
  // =========================================================================

  describe("listRequests", () => {
    it("returns paginated results with total count", async () => {
      const rows = [makeDbRequest({ id: "rr_1" }), makeDbRequest({ id: "rr_2" })];

      const builder: Builder = makeBuilder({ data: rows, error: null, count: 42 });
      (callerSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue(builder);

      const result = await listRequests(callerSupabase, { page: 1, limit: 20 });

      expect(result.data).toHaveLength(2);
      expect(result.count).toBe(42);
    });

    it("applies status filter when provided", async () => {
      const rows = [makeDbRequest({ id: "rr_pending", status: "pending_review" })];
      const builder: Builder = makeBuilder({ data: rows, error: null, count: 1 });
      (callerSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue(builder);

      const result = await listRequests(callerSupabase, { status: "pending_review" });

      expect(result.data[0].status).toBe("pending_review");
      // eq filter should have been applied
      expect((builder.eq as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(
        "status",
        "pending_review",
      );
    });

    it("uses correct range for page 2 with limit 10", async () => {
      const builder: Builder = makeBuilder({ data: [], error: null, count: 0 });
      (callerSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue(builder);

      await listRequests(callerSupabase, { page: 2, limit: 10 });

      // page 2, limit 10 → from=10, to=19
      expect((builder.range as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(10, 19);
    });

    it("returns empty array and zero count when no results", async () => {
      const builder: Builder = makeBuilder({ data: null, error: null, count: null });
      (callerSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue(builder);

      const result = await listRequests(callerSupabase);

      expect(result.data).toEqual([]);
      expect(result.count).toBe(0);
    });

    it("throws when supabase query errors", async () => {
      const builder: Builder = makeBuilder({
        data: null,
        error: { message: "connection refused", code: "08006" },
        count: null,
      });
      (callerSupabase.from as ReturnType<typeof vi.fn>).mockReturnValue(builder);

      await expect(listRequests(callerSupabase)).rejects.toThrow(
        "Failed to list refund requests",
      );
    });
  });

  // =========================================================================
  // Constants sanity checks
  // =========================================================================

  describe("exported constants", () => {
    it("REFUND_AUTO_APPROVE_LIMIT_PENCE is 10_000 (£100)", () => {
      expect(REFUND_AUTO_APPROVE_LIMIT_PENCE).toBe(10_000);
    });

    it("REFUND_WINDOW_DAYS is 14", () => {
      expect(REFUND_WINDOW_DAYS).toBe(14);
    });
  });
});
