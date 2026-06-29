/**
 * Financial snapshot — pure synthesis over the existing mortgage and SDLT
 * calculators. Answers "what does this cost me?" with a single headline (total
 * monthly cost + total upfront + indicative income required) computed from
 * transparent, documented assumptions. It does NOT introduce a new calc engine:
 * the monthly payment comes from `calculateMonthlyPayment` and the stamp duty
 * from `calculateSdlt`.
 *
 * Every figure is indicative guidance, not a mortgage offer.
 */

import { calculateMonthlyPayment } from "@/lib/calculators/mortgage";
import { calculateSdlt } from "@/lib/calculators/sdlt";

export type FinancialAssumptions = {
  /** Deposit as a fraction of price (0.1 = 10%). */
  depositPercent: number;
  /** Indicative annual mortgage rate, as a percentage (5 = 5%). */
  annualRatePercent: number;
  /** Mortgage term in years. */
  termYears: number;
  /** Income multiple lenders typically advance (loan ÷ multiple = income). */
  incomeMultiple: number;
  /** Indicative legal + moving costs added to the upfront total. */
  legalAndMovingCost: number;
};

export const DEFAULT_FINANCIAL_ASSUMPTIONS: FinancialAssumptions = {
  depositPercent: 0.1,
  annualRatePercent: 5,
  termYears: 25,
  incomeMultiple: 4.5,
  legalAndMovingCost: 2000,
};

/**
 * Indicative average annual council tax by band (England, 2025/26 ballpark).
 * Used only to put a monthly running-cost figure next to the mortgage; not a
 * billing authority quote.
 */
export const COUNCIL_TAX_ANNUAL_BY_BAND: Record<string, number> = {
  A: 1500,
  B: 1750,
  C: 2000,
  D: 2250,
  E: 2750,
  F: 3250,
  G: 3750,
  H: 4500,
};

export type BuyFinancialSnapshot = {
  deposit: number;
  loanAmount: number;
  monthlyMortgage: number;
  stampDuty: number;
  legalAndMoving: number;
  totalUpfront: number;
  monthlyCouncilTax: number | null;
  totalMonthly: number;
  incomeRequired: number;
  assumptions: FinancialAssumptions;
};

export function buildBuyFinancialSnapshot(
  price: number,
  councilTaxBand: string | null,
  overrides: Partial<FinancialAssumptions> = {},
): BuyFinancialSnapshot {
  const assumptions = { ...DEFAULT_FINANCIAL_ASSUMPTIONS, ...overrides };

  const deposit = Math.round(price * assumptions.depositPercent);
  const loanAmount = Math.max(0, price - deposit);
  const monthlyMortgage = calculateMonthlyPayment(
    loanAmount,
    assumptions.annualRatePercent,
    assumptions.termYears,
  );
  const stampDuty = calculateSdlt(price, "standard").totalTax;
  const totalUpfront = deposit + stampDuty + assumptions.legalAndMovingCost;

  const bandKey = councilTaxBand?.trim().toUpperCase() ?? "";
  const annualCouncilTax = COUNCIL_TAX_ANNUAL_BY_BAND[bandKey] ?? null;
  const monthlyCouncilTax =
    annualCouncilTax != null ? Math.round(annualCouncilTax / 12) : null;

  const totalMonthly = Math.round(monthlyMortgage + (monthlyCouncilTax ?? 0));
  const incomeRequired = Math.round(loanAmount / assumptions.incomeMultiple);

  return {
    deposit,
    loanAmount,
    monthlyMortgage,
    stampDuty,
    legalAndMoving: assumptions.legalAndMovingCost,
    totalUpfront,
    monthlyCouncilTax,
    totalMonthly,
    incomeRequired,
    assumptions,
  };
}

/**
 * Indicative gross annual income a referencing agency typically expects for a
 * tenancy: ~30× the monthly rent (≈ 2.5× annual rent). Guidance only.
 */
export const RENT_INCOME_MONTHLY_MULTIPLE = 30;

export function rentIncomeRequired(monthlyRent: number): number {
  return Math.max(0, Math.round(monthlyRent * RENT_INCOME_MONTHLY_MULTIPLE));
}
