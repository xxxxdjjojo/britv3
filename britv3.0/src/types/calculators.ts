/**
 * Calculator-related TypeScript types
 * Used by mortgage and SDLT calculators
 */

export type MortgageParams = Readonly<{
  deposit: number;
  interestRate: number;
  termYears: number;
}>;

export type MortgageResult = Readonly<{
  monthlyPayment: number;
  totalRepayable: number;
  totalInterest: number;
}>;

export type SdltBand = Readonly<{
  threshold: number;
  rate: number;
}>;

export type BuyerType = "standard" | "first_time" | "additional";

export type SdltBandBreakdown = Readonly<{
  from: number;
  to: number;
  rate: number;
  tax: number;
}>;

export type SdltResult = Readonly<{
  totalTax: number;
  effectiveRate: number;
  bands: ReadonlyArray<SdltBandBreakdown>;
}>;
