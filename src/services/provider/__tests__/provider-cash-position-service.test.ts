/**
 * provider-cash-position-service.test.ts
 *
 * Unit tests for getCashPosition. Supabase client and getStripeBalance
 * are fully mocked so no network calls are made.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

// Mock the payment service before importing the module under test
vi.mock("../provider-payment-service", () => ({
  getStripeBalance: vi.fn(),
}));

import { getCashPosition } from "../provider-cash-position-service";
import { getStripeBalance } from "../provider-payment-service";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type MockInvoiceRow = { total_amount: number };

function makeSupabaseMock(results: {
  sent?: MockInvoiceRow[];
  paid?: MockInvoiceRow[];
  overdue?: MockInvoiceRow[];
  sentError?: boolean;
  paidError?: boolean;
  overdueError?: boolean;
}): SupabaseClient {
  // We need the query builder to return different data based on the .eq("status", …) call.
  // We track which status is being queried by capturing the second argument of the last
  // .eq() call before the promise resolves.

  const buildQuery = (rows: MockInvoiceRow[] | undefined, hasError: boolean) => {
    const query = {
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      then: (
        resolve: (v: { data: MockInvoiceRow[] | null; error: Error | null }) => void,
      ) => {
        resolve({
          data: hasError ? null : (rows ?? []),
          error: hasError ? new Error("db error") : null,
        });
        return query;
      },
    };
    return query;
  };

  // Track call order: sent → paid → overdue (order in Promise.allSettled)
  let callCount = 0;
  const queries = [
    buildQuery(results.sent, results.sentError ?? false),
    buildQuery(results.paid, results.paidError ?? false),
    buildQuery(results.overdue, results.overdueError ?? false),
  ];

  const supabase = {
    from: vi.fn(() => {
      const q = queries[callCount % queries.length];
      callCount++;
      return q;
    }),
  } as unknown as SupabaseClient;

  return supabase;
}

const mockGetStripeBalance = vi.mocked(getStripeBalance);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockGetStripeBalance.mockResolvedValue({
    availablePence: 0,
    pendingPence: 0,
    currency: "gbp",
    nextPayoutDate: null,
    nextPayoutAmountPence: null,
  });
});

describe("getCashPosition", () => {
  it("returns zero cash position when no invoices", async () => {
    const supabase = makeSupabaseMock({ sent: [], paid: [], overdue: [] });

    const result = await getCashPosition("provider-1", supabase);

    expect(result.invoicedPence).toBe(0);
    expect(result.invoicedCount).toBe(0);
    expect(result.receivedPence).toBe(0);
    expect(result.receivedCount).toBe(0);
    expect(result.overduePence).toBe(0);
    expect(result.overdueCount).toBe(0);
    expect(result.stripeAvailablePence).toBe(0);
    expect(result.stripePendingPence).toBe(0);
    expect(result.netPositionPence).toBe(0);
  });

  it("sums sent invoices correctly", async () => {
    const supabase = makeSupabaseMock({
      sent: [{ total_amount: 100 }, { total_amount: 50.5 }],
      paid: [],
      overdue: [],
    });

    const result = await getCashPosition("provider-1", supabase);

    // 100 * 100 + 50.5 * 100 = 10000 + 5050 = 15050
    expect(result.invoicedPence).toBe(15050);
    expect(result.invoicedCount).toBe(2);
  });

  it("sums paid invoices correctly", async () => {
    const supabase = makeSupabaseMock({
      sent: [],
      paid: [{ total_amount: 200 }, { total_amount: 75 }],
      overdue: [],
    });

    const result = await getCashPosition("provider-1", supabase);

    expect(result.receivedPence).toBe(27500); // 200*100 + 75*100
    expect(result.receivedCount).toBe(2);
  });

  it("sums overdue invoices correctly", async () => {
    const supabase = makeSupabaseMock({
      sent: [],
      paid: [],
      overdue: [{ total_amount: 300 }],
    });

    const result = await getCashPosition("provider-1", supabase);

    expect(result.overduePence).toBe(30000);
    expect(result.overdueCount).toBe(1);
  });

  it("computes net position correctly", async () => {
    mockGetStripeBalance.mockResolvedValue({
      availablePence: 5000,
      pendingPence: 2000,
      currency: "gbp",
      nextPayoutDate: null,
      nextPayoutAmountPence: null,
    });

    const supabase = makeSupabaseMock({
      sent: [{ total_amount: 100 }],
      paid: [{ total_amount: 200 }],
      overdue: [{ total_amount: 50 }],
    });

    const result = await getCashPosition("provider-1", supabase);

    // received=20000, stripeAvailable=5000, overdue=5000
    // net = 20000 + 5000 - 5000 = 20000
    expect(result.receivedPence).toBe(20000);
    expect(result.stripeAvailablePence).toBe(5000);
    expect(result.stripePendingPence).toBe(2000);
    expect(result.overduePence).toBe(5000);
    expect(result.netPositionPence).toBe(20000);
  });

  it("handles individual query failures gracefully (defaults to 0)", async () => {
    const supabase = makeSupabaseMock({
      sent: [{ total_amount: 100 }],
      paid: undefined,
      paidError: true,
      overdue: undefined,
      overdueError: true,
    });

    const result = await getCashPosition("provider-1", supabase);

    expect(result.invoicedPence).toBe(10000);
    expect(result.receivedPence).toBe(0);
    expect(result.overduePence).toBe(0);
  });

  it("defaults stripe values to 0 when getStripeBalance throws", async () => {
    mockGetStripeBalance.mockRejectedValue(new Error("No Stripe account"));

    const supabase = makeSupabaseMock({
      sent: [],
      paid: [{ total_amount: 100 }],
      overdue: [],
    });

    const result = await getCashPosition("provider-1", supabase);

    expect(result.stripeAvailablePence).toBe(0);
    expect(result.stripePendingPence).toBe(0);
    // net = 10000 + 0 - 0 = 10000
    expect(result.netPositionPence).toBe(10000);
  });
});
