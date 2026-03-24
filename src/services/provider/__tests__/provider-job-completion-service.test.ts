/**
 * Tests for provider-job-completion-service.
 *
 * Functions under contract:
 *  - initiateJobCompletion(bookingId, providerId, supabase, options?)
 *
 * Design: The service uses an intermediate "completing" state so that a crash
 * between setting "completing" and "completed" leaves the booking in a detectable
 * limbo rather than incorrectly marking it complete without an invoice.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the invoice service before importing the SUT
vi.mock("@/services/provider/provider-invoice-service", () => ({
  generateInvoice: vi.fn(),
}));

// Mock the booking state machine
vi.mock("@/lib/marketplace/booking-state-machine", () => ({
  canTransition: vi.fn(),
}));

import { initiateJobCompletion } from "../provider-job-completion-service";
import { generateInvoice } from "@/services/provider/provider-invoice-service";
import { canTransition } from "@/lib/marketplace/booking-state-machine";

const mockGenerateInvoice = vi.mocked(generateInvoice);
const mockCanTransition = vi.mocked(canTransition);

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

type CallRecord = { table: string; op: string; args: unknown[] };

/**
 * Build a flexible Supabase mock.
 * tableData: map of table name → data returned for .maybeSingle() / .single()
 * The mock tracks all calls in `calls` for assertions.
 * Update and insert operations return { data: null, error: null } by default
 * unless overridden via updateError / insertError options.
 */
function buildSupabaseMock(options: {
  bookingData?: Record<string, unknown> | null;
  updateError?: { message: string } | null;
  insertError?: { message: string } | null;
  insertData?: Record<string, unknown> | null;
  calls?: CallRecord[];
}) {
  const calls: CallRecord[] = options.calls ?? [];

  const chainTerminal = (table: string, op: string) => ({
    maybeSingle: vi.fn().mockResolvedValue({
      data: op === "select" && table === "bookings" ? options.bookingData ?? null : null,
      error: null,
    }),
    single: vi.fn().mockResolvedValue({
      data: options.insertData ?? null,
      error: options.insertError ?? null,
    }),
  });

  const makeUpdateChain = (table: string) => {
    const setFn = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: null,
        error: options.updateError ?? null,
      }),
    });
    calls.push({ table, op: "update", args: [] });
    return { set: setFn, eq: setFn };
  };

  const fromFn = vi.fn().mockImplementation((table: string) => {
    return {
      select: vi.fn().mockImplementation((...args: unknown[]) => {
        calls.push({ table, op: "select", args });
        return {
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: table === "bookings" ? options.bookingData ?? null : null,
              error: null,
            }),
            eq: vi.fn().mockReturnValue(chainTerminal(table, "select")),
          }),
        };
      }),
      update: vi.fn().mockImplementation((patch: unknown) => {
        calls.push({ table, op: "update", args: [patch] });
        return {
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: null, error: options.updateError ?? null }),
            // allow direct resolve when only one .eq() is chained
            then: (resolve: (v: { data: null; error: null }) => void) =>
              resolve({ data: null, error: null }),
          }),
          // handle single .eq() chain
          set: makeUpdateChain(table).set,
        };
      }),
      insert: vi.fn().mockImplementation((row: unknown) => {
        calls.push({ table, op: "insert", args: [row] });
        return {
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: options.insertData ?? null,
              error: options.insertError ?? null,
            }),
          }),
          // allow bare insert to resolve
          then: (resolve: (v: { data: null; error: null }) => void) =>
            resolve({ data: null, error: null }),
        };
      }),
    };
  });

  return { from: fromFn, _calls: calls } as unknown;
}

/**
 * Builds a tracking Supabase mock where every call is recorded precisely
 * and each table operation returns success.
 */
function buildTrackingSupabaseMock(bookingData: Record<string, unknown>) {
  const updateCalls: Array<{ table: string; patch: unknown }> = [];
  const insertCalls: Array<{ table: string; row: unknown }> = [];

  const fromFn = vi.fn().mockImplementation((table: string) => ({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: bookingData, error: null }),
      }),
    }),
    update: vi.fn().mockImplementation((patch: unknown) => {
      updateCalls.push({ table, patch });
      const eqChain = {
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      // make it directly awaitable too
      return {
        eq: vi.fn().mockReturnValue(eqChain),
      };
    }),
    insert: vi.fn().mockImplementation((row: unknown) => {
      insertCalls.push({ table, row });
      return {
        // allow bare insert (no .select().single())
        then: (resolve: (v: { data: null; error: null }) => void) =>
          resolve({ data: null, error: null }),
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      };
    }),
  }));

  return { from: fromFn, updateCalls, insertCalls };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const PROVIDER_ID = "provider-uuid-1";
const BOOKING_ID = "booking-uuid-1";
const USER_ID = "user-uuid-1";

const IN_PROGRESS_BOOKING = {
  id: BOOKING_ID,
  provider_id: PROVIDER_ID,
  status: "in_progress",
  user_id: USER_ID,
};

beforeEach(() => {
  vi.clearAllMocks();
  // Default: canTransition returns allowed for in_progress → completing
  mockCanTransition.mockReturnValue({ allowed: true, requiresReason: false });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("initiateJobCompletion", () => {
  describe("happy path — no invoice", () => {
    it("transitions in_progress → completing → completed and returns { status: 'completed' }", async () => {
      const { from, updateCalls } = buildTrackingSupabaseMock(IN_PROGRESS_BOOKING);
      const supabase = { from } as unknown;

      const result = await initiateJobCompletion(BOOKING_ID, PROVIDER_ID, supabase);

      expect(result.status).toBe("completed");
      expect(result.bookingId).toBe(BOOKING_ID);
      expect(result.error).toBeUndefined();

      // Verify two update calls: set "completing" then set "completed"
      expect(updateCalls).toHaveLength(2);
      expect((updateCalls[0].patch as Record<string, unknown>)["status"]).toBe("completing");
      expect((updateCalls[1].patch as Record<string, unknown>)["status"]).toBe("completed");
    });
  });

  describe("validation — booking not found", () => {
    it("returns an error result when the booking does not exist", async () => {
      const { from } = buildTrackingSupabaseMock(null as unknown as Record<string, unknown>);
      // Override select to return null data
      const fromFn = vi.fn().mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }));
      const supabase = { from: fromFn } as unknown;

      const result = await initiateJobCompletion(BOOKING_ID, PROVIDER_ID, supabase);

      expect(result.status).toBe("rolled_back");
      expect(result.error).toMatch(/not found/i);
    });
  });

  describe("validation — wrong provider", () => {
    it("returns an error result when booking belongs to a different provider", async () => {
      const booking = { ...IN_PROGRESS_BOOKING, provider_id: "other-provider-uuid" };
      const fromFn = vi.fn().mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: booking, error: null }),
          }),
        }),
      }));
      const supabase = { from: fromFn } as unknown;

      const result = await initiateJobCompletion(BOOKING_ID, PROVIDER_ID, supabase);

      expect(result.status).toBe("rolled_back");
      expect(result.error).toMatch(/forbidden|not authorised|not authorized/i);
    });
  });

  describe("validation — wrong status", () => {
    it("returns an error result when booking is not in_progress", async () => {
      const booking = { ...IN_PROGRESS_BOOKING, status: "confirmed" };
      const fromFn = vi.fn().mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: booking, error: null }),
          }),
        }),
      }));
      const supabase = { from: fromFn } as unknown;

      const result = await initiateJobCompletion(BOOKING_ID, PROVIDER_ID, supabase);

      expect(result.status).toBe("rolled_back");
      expect(result.error).toMatch(/in_progress|status/i);
    });
  });

  describe("invoice generation — success", () => {
    it("generates an invoice when option is set and returns invoiceId", async () => {
      const fakeInvoice = { id: "invoice-uuid-99", status: "draft" };
      mockGenerateInvoice.mockResolvedValue(fakeInvoice as never);

      const { from } = buildTrackingSupabaseMock(IN_PROGRESS_BOOKING);
      const supabase = { from } as unknown;

      const lineItems = [
        {
          name: "Labour",
          quantity: 2,
          unit_price_pence: 5000,
          total_pence: 10000,
          vat_rate: 0.2,
        },
      ];

      const result = await initiateJobCompletion(BOOKING_ID, PROVIDER_ID, supabase, {
        generateInvoice: true,
        lineItems,
      });

      expect(result.status).toBe("completed");
      expect(result.invoiceId).toBe("invoice-uuid-99");
      expect(mockGenerateInvoice).toHaveBeenCalledOnce();
      expect(mockGenerateInvoice).toHaveBeenCalledWith(
        supabase,
        PROVIDER_ID,
        expect.objectContaining({
          booking_id: BOOKING_ID,
          client_id: USER_ID,
          line_items: lineItems,
        }),
      );
    });
  });

  describe("invoice generation — failure → rollback", () => {
    it("rolls back to in_progress and returns { status: 'rolled_back', error } when invoice fails", async () => {
      mockGenerateInvoice.mockRejectedValue(new Error("Stripe timeout"));

      const updateCalls: Array<{ table: string; patch: unknown }> = [];
      const insertCalls: Array<{ table: string; row: unknown }> = [];

      const fromFn = vi.fn().mockImplementation((table: string) => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: IN_PROGRESS_BOOKING, error: null }),
          }),
        }),
        update: vi.fn().mockImplementation((patch: unknown) => {
          updateCalls.push({ table, patch });
          return { eq: vi.fn().mockResolvedValue({ data: null, error: null }) };
        }),
        insert: vi.fn().mockImplementation((row: unknown) => {
          insertCalls.push({ table, row });
          return {
            then: (resolve: (v: { data: null; error: null }) => void) =>
              resolve({ data: null, error: null }),
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          };
        }),
      }));
      const supabase = { from: fromFn } as unknown;

      const result = await initiateJobCompletion(BOOKING_ID, PROVIDER_ID, supabase, {
        generateInvoice: true,
        lineItems: [
          { name: "Labour", quantity: 1, unit_price_pence: 10000, total_pence: 10000 },
        ],
      });

      expect(result.status).toBe("rolled_back");
      expect(result.error).toMatch(/Stripe timeout/);

      // First update was "completing", rollback update should set "in_progress"
      const statuses = updateCalls.map(
        (c) => (c.patch as Record<string, unknown>)["status"],
      );
      expect(statuses).toContain("completing");
      expect(statuses).toContain("in_progress");
    });
  });

  describe("audit trail — booking_status_history inserts", () => {
    it("inserts history entries for the completing and completed transitions", async () => {
      const insertCalls: Array<{ table: string; row: unknown }> = [];

      const fromFn = vi.fn().mockImplementation((table: string) => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: IN_PROGRESS_BOOKING, error: null }),
          }),
        }),
        update: vi.fn().mockImplementation(() => ({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
        insert: vi.fn().mockImplementation((row: unknown) => {
          insertCalls.push({ table, row });
          return {
            then: (resolve: (v: { data: null; error: null }) => void) =>
              resolve({ data: null, error: null }),
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          };
        }),
      }));
      const supabase = { from: fromFn } as unknown;

      await initiateJobCompletion(BOOKING_ID, PROVIDER_ID, supabase);

      const historyInserts = insertCalls.filter(
        (c) => c.table === "booking_status_history",
      );
      expect(historyInserts.length).toBeGreaterThanOrEqual(2);

      const rows = historyInserts.map((c) => c.row as Record<string, unknown>);
      const toCompletingRow = rows.find((r) => r["to_status"] === "completing");
      const toCompletedRow = rows.find((r) => r["to_status"] === "completed");

      expect(toCompletingRow).toBeDefined();
      expect(toCompletingRow!["from_status"]).toBe("in_progress");
      expect(toCompletingRow!["changed_by"]).toBe(PROVIDER_ID);

      expect(toCompletedRow).toBeDefined();
      expect(toCompletedRow!["from_status"]).toBe("completing");
    });
  });
});
