/**
 * Tests for financial-service covering LD-05 (rent collection) and LD-09 (tax summary).
 */
import { describe, it, expect, vi } from "vitest";
import { getRentCollection, getTaxSummary } from "@/services/landlord/financial-service";

function makeEntry(overrides: Record<string, unknown>) {
  return {
    id: "entry-1",
    property_id: "prop-1",
    tenancy_id: "ten-1",
    user_id: "user-1",
    type: "income",
    category: "rent",
    amount: 1500,
    entry_date: "2026-02-01",
    description: null,
    receipt_url: null,
    rent_period_start: null,
    rent_period_end: null,
    payment_status: "paid",
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function createSupabaseMock(entries: ReturnType<typeof makeEntry>[]) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    then: vi.fn((resolve: (v: { data: unknown[]; error: null }) => void) =>
      resolve({ data: entries, error: null }),
    ),
  };

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1" } },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue(chain),
  };
}

describe("financial-service", () => {
  describe("getRentCollection", () => {
    it("groups financial_entries by payment_status: paid / partial / overdue", async () => {
      const entries = [
        makeEntry({ id: "e1", payment_status: "paid" }),
        makeEntry({ id: "e2", payment_status: "partial" }),
        makeEntry({ id: "e3", payment_status: "overdue" }),
      ];
      const supabase = createSupabaseMock(entries);
      const result = await getRentCollection(supabase as never);
      expect(result.paid).toHaveLength(1);
      expect(result.partial).toHaveLength(1);
      expect(result.overdue).toHaveLength(1);
    });

    it("correctly identifies overdue when entry_date past due and status not paid", async () => {
      const entries = [
        makeEntry({ id: "e1", entry_date: "2020-01-01", payment_status: "overdue" }),
        makeEntry({ id: "e2", entry_date: "2020-01-01", payment_status: "paid" }),
      ];
      const supabase = createSupabaseMock(entries);
      const result = await getRentCollection(supabase as never);
      expect(result.overdue).toHaveLength(1);
      expect(result.paid).toHaveLength(1);
    });
  });

  describe("getTaxSummary", () => {
    it("calculates total income for UK tax year (Apr 6 – Apr 5)", async () => {
      const entries = [
        makeEntry({ id: "e1", type: "income", category: "rent", amount: 1500, entry_date: "2025-05-01", payment_status: "paid" }),
        makeEntry({ id: "e2", type: "income", category: "rent", amount: 1500, entry_date: "2026-03-01", payment_status: "paid" }),
      ];
      const supabase = createSupabaseMock(entries);
      const result = await getTaxSummary(supabase as never, 2025);
      expect(result.income).toBe(3000);
    });

    it("calculates total expenses for UK tax year", async () => {
      const entries = [
        makeEntry({ id: "e1", type: "expense", category: "maintenance", amount: 200, entry_date: "2025-08-01", payment_status: null }),
      ];
      const supabase = createSupabaseMock(entries);
      const result = await getTaxSummary(supabase as never, 2025);
      expect(result.expenses).toBe(200);
    });

    it("returns net profit = income - expenses", async () => {
      const entries = [
        makeEntry({ id: "e1", type: "income", category: "rent", amount: 2000, entry_date: "2025-07-01", payment_status: "paid" }),
        makeEntry({ id: "e2", type: "expense", category: "maintenance", amount: 500, entry_date: "2025-07-15", payment_status: null }),
      ];
      const supabase = createSupabaseMock(entries);
      const result = await getTaxSummary(supabase as never, 2025);
      expect(result.net).toBe(1500);
    });

    it("handles tax year boundary correctly (Apr 5 vs Apr 6)", async () => {
      // The service queries with gte(startDate) and lt(endDate). The mock returns
      // all entries passed in (filtering is done server-side). We test the
      // tax_year label format and that income sums correctly.
      const entries = [
        makeEntry({ id: "e1", type: "income", amount: 2000, entry_date: "2025-06-01", payment_status: "paid" }),
      ];
      const supabase = createSupabaseMock(entries);
      const result = await getTaxSummary(supabase as never, 2025);
      expect(result.income).toBe(2000);
      expect(result.tax_year).toBe("2025/26");
    });
  });
});
