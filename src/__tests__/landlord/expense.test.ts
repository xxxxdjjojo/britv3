import { describe, it, expect } from "vitest";
import {
  financialEntrySchema,
  FINANCIAL_ENTRY_TYPES,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
} from "@/types/landlord";

describe("financialEntrySchema", () => {
  it("accepts valid income entry", () => {
    const result = financialEntrySchema.safeParse({
      type: "income",
      category: "rent",
      amount: 1200,
      entry_date: "2026-03-01",
      description: "March rent",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid expense entry", () => {
    const result = financialEntrySchema.safeParse({
      type: "expense",
      category: "maintenance",
      amount: 250,
      entry_date: "2026-03-05",
      description: "Plumber for leaking tap",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing category", () => {
    const result = financialEntrySchema.safeParse({
      type: "income",
      category: "",
      amount: 1200,
      entry_date: "2026-03-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative amount", () => {
    const result = financialEntrySchema.safeParse({
      type: "expense",
      category: "insurance",
      amount: -50,
      entry_date: "2026-03-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero amount", () => {
    const result = financialEntrySchema.safeParse({
      type: "income",
      category: "rent",
      amount: 0,
      entry_date: "2026-03-01",
    });
    expect(result.success).toBe(false);
  });

  it("coerces string amount to number", () => {
    const result = financialEntrySchema.parse({
      type: "income",
      category: "rent",
      amount: "1200",
      entry_date: "2026-03-01",
    });
    expect(result.amount).toBe(1200);
    expect(typeof result.amount).toBe("number");
  });

  it("rejects missing entry_date", () => {
    const result = financialEntrySchema.safeParse({
      type: "expense",
      category: "maintenance",
      amount: 100,
      entry_date: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid type", () => {
    const result = financialEntrySchema.safeParse({
      type: "transfer",
      category: "rent",
      amount: 100,
      entry_date: "2026-03-01",
    });
    expect(result.success).toBe(false);
  });

  it("allows empty description", () => {
    const result = financialEntrySchema.safeParse({
      type: "income",
      category: "rent",
      amount: 1200,
      entry_date: "2026-03-01",
      description: "",
    });
    expect(result.success).toBe(true);
  });

  it("allows optional rent period fields", () => {
    const result = financialEntrySchema.parse({
      type: "income",
      category: "rent",
      amount: 1200,
      entry_date: "2026-03-01",
      rent_period_start: "2026-03-01",
      rent_period_end: "2026-03-31",
    });
    expect(result.rent_period_start).toBe("2026-03-01");
    expect(result.rent_period_end).toBe("2026-03-31");
  });
});

describe("financial category constants", () => {
  it("has income and expense types", () => {
    expect(FINANCIAL_ENTRY_TYPES).toEqual(["income", "expense"]);
  });

  it("has income categories", () => {
    expect(INCOME_CATEGORIES).toContain("rent");
    expect(INCOME_CATEGORIES).toContain("deposit");
    expect(INCOME_CATEGORIES).toContain("other_income");
  });

  it("has expense categories", () => {
    expect(EXPENSE_CATEGORIES).toContain("maintenance");
    expect(EXPENSE_CATEGORIES).toContain("insurance");
    expect(EXPENSE_CATEGORIES).toContain("mortgage");
    expect(EXPENSE_CATEGORIES).toContain("management_fee");
  });
});
