/**
 * Test stubs for financial-service covering LD-05 (rent collection) and LD-09 (tax summary).
 * These are Wave 0 stubs — implementation ships in plan 14-05.
 */
import { describe, it } from "vitest";

describe("financial-service", () => {
  describe("getRentCollection", () => {
    it.todo(
      "groups financial_entries by payment_status: paid / partial / overdue",
    );
    it.todo(
      "correctly identifies overdue when entry_date past due and status not paid",
    );
  });

  describe("getTaxSummary", () => {
    it.todo("calculates total income for UK tax year (Apr 6 – Apr 5)");
    it.todo("calculates total expenses for UK tax year");
    it.todo("returns net profit = income - expenses");
    it.todo("handles tax year boundary correctly (Apr 5 vs Apr 6)");
  });
});
