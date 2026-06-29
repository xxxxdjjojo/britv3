import { describe, it, expect } from "vitest";
import {
  buildBuyFinancialSnapshot,
  rentIncomeRequired,
  DEFAULT_FINANCIAL_ASSUMPTIONS,
} from "./financial-snapshot";
import { calculateMonthlyPayment } from "@/lib/calculators/mortgage";
import { calculateSdlt } from "@/lib/calculators/sdlt";

describe("buildBuyFinancialSnapshot", () => {
  it("derives deposit, loan, and reuses the mortgage + SDLT calculators", () => {
    const s = buildBuyFinancialSnapshot(500000, "D");
    expect(s.deposit).toBe(50000); // 10%
    expect(s.loanAmount).toBe(450000);
    expect(s.monthlyMortgage).toBe(
      calculateMonthlyPayment(450000, 5, 25),
    );
    expect(s.stampDuty).toBe(calculateSdlt(500000, "standard").totalTax);
  });

  it("includes deposit + SDLT + legal/moving in the upfront total", () => {
    const s = buildBuyFinancialSnapshot(500000, "D");
    expect(s.totalUpfront).toBe(
      s.deposit + s.stampDuty + DEFAULT_FINANCIAL_ASSUMPTIONS.legalAndMovingCost,
    );
  });

  it("adds a monthly council-tax figure from a known band", () => {
    const s = buildBuyFinancialSnapshot(500000, "D");
    expect(s.monthlyCouncilTax).toBe(Math.round(2250 / 12));
    expect(s.totalMonthly).toBe(
      Math.round(s.monthlyMortgage + (s.monthlyCouncilTax ?? 0)),
    );
  });

  it("returns null council tax for an unknown band and excludes it from monthly", () => {
    const s = buildBuyFinancialSnapshot(500000, null);
    expect(s.monthlyCouncilTax).toBeNull();
    expect(s.totalMonthly).toBe(Math.round(s.monthlyMortgage));
  });

  it("normalises band casing/whitespace", () => {
    expect(buildBuyFinancialSnapshot(500000, " d ").monthlyCouncilTax).toBe(
      Math.round(2250 / 12),
    );
  });

  it("derives income required from the loan and the income multiple", () => {
    const s = buildBuyFinancialSnapshot(500000, "D");
    expect(s.incomeRequired).toBe(Math.round(450000 / 4.5));
  });

  it("honours assumption overrides", () => {
    const s = buildBuyFinancialSnapshot(500000, "D", { depositPercent: 0.25 });
    expect(s.deposit).toBe(125000);
    expect(s.loanAmount).toBe(375000);
  });
});

describe("rentIncomeRequired", () => {
  it("is 30× the monthly rent", () => {
    expect(rentIncomeRequired(2000)).toBe(60000);
  });
  it("never goes negative", () => {
    expect(rentIncomeRequired(-100)).toBe(0);
  });
});
