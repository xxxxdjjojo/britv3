/**
 * Rent affordability calculator — pure utility.
 *
 * Uses the 30% rule as the baseline (rent should not exceed 30% of gross
 * monthly take-home), adjusted for existing debt commitments and essential
 * outgoings. Applies a conservative stress test at 35% to flag boundary cases.
 *
 * This is a guidance tool, NOT a guarantee of landlord or referencing approval.
 */

export type RentAffordabilityInput = Readonly<{
  /** Monthly take-home (net) income after tax */
  monthlyTakeHome: number;
  /** Essential monthly outgoings (excluding rent): food, transport, utilities, childcare */
  essentialOutgoings: number;
  /** Existing monthly debt commitments: loans, credit cards, car finance */
  existingDebt: number;
}>;

export type RentAffordabilityResult = Readonly<{
  /** Recommended maximum monthly rent (30% rule, debt-adjusted) */
  maxRent: number;
  /** Weekly equivalent of maxRent */
  maxRentWeekly: number;
  /** Rent-to-income ratio at the recommended max (percentage) */
  ratio: number;
  /** Whether the user is in the stress zone (>35% of take-home) */
  isStretched: boolean;
  /** Total disposable income after rent and commitments */
  disposableAfterRent: number;
  /** Recommended deposit (5 weeks' rent per Tenant Fees Act 2019 cap) */
  recommendedDeposit: number;
  /** Recommended holding deposit (1 week's rent) */
  recommendedHoldingDeposit: number;
}>;

const WEEKS_PER_MONTH = 52 / 12;

/**
 * Calculate recommended maximum monthly rent.
 *
 * Algorithm:
 * 1. Start with 30% of take-home (standard affordability benchmark).
 * 2. Subtract existing debt commitments (they reduce what's available for rent).
 * 3. Ensure result is non-negative.
 * 4. Flag as "stretched" if the result exceeds 35% of take-home.
 */
export function calculateRentAffordability(
  input: RentAffordabilityInput,
): RentAffordabilityResult {
  const { monthlyTakeHome, essentialOutgoings, existingDebt } = input;

  // Guard against invalid inputs
  const takeHome = Math.max(0, monthlyTakeHome);
  const debt = Math.max(0, existingDebt);

  // 30% rule baseline
  const benchmarkRent = takeHome * 0.30;

  // Debt reduces available capacity: each £1 of monthly debt reduces max rent by ~£0.75
  // (Debt is already paid from take-home, so the reduction is softer than 1:1)
  const debtReduction = debt * 0.75;
  const maxRent = Math.max(0, Math.round(benchmarkRent - debtReduction));

  const maxRentWeekly = Math.round((maxRent / WEEKS_PER_MONTH) * 100) / 100;
  const ratio = takeHome > 0 ? Math.round((maxRent / takeHome) * 100) : 0;
  const isStretched = takeHome > 0 && (maxRent / takeHome) > 0.35;

  const totalCommitments = maxRent + essentialOutgoings + debt;
  const disposableAfterRent = Math.max(0, Math.round(takeHome - totalCommitments));

  const recommendedDeposit = Math.round(maxRent * 5 / WEEKS_PER_MONTH);
  const recommendedHoldingDeposit = Math.round(maxRent / WEEKS_PER_MONTH);

  return {
    maxRent,
    maxRentWeekly,
    ratio,
    isStretched,
    disposableAfterRent,
    recommendedDeposit,
    recommendedHoldingDeposit,
  };
}

/**
 * Validate affordability inputs.
 * Returns an object with field-level error messages (empty = valid).
 */
export function validateAffordabilityInput(
  input: Partial<RentAffordabilityInput>,
): Record<keyof RentAffordabilityInput, string> {
  const errors = {
    monthlyTakeHome: "",
    essentialOutgoings: "",
    existingDebt: "",
  };

  if (input.monthlyTakeHome === undefined || input.monthlyTakeHome === null || isNaN(input.monthlyTakeHome)) {
    errors.monthlyTakeHome = "Enter your monthly take-home pay";
  } else if (input.monthlyTakeHome < 0) {
    errors.monthlyTakeHome = "Income cannot be negative";
  } else if (input.monthlyTakeHome === 0) {
    errors.monthlyTakeHome = "Income must be greater than zero";
  }

  if (input.essentialOutgoings !== undefined && input.essentialOutgoings !== null) {
    if (isNaN(input.essentialOutgoings)) {
      errors.essentialOutgoings = "Enter a valid amount";
    } else if (input.essentialOutgoings < 0) {
      errors.essentialOutgoings = "Outgoings cannot be negative";
    }
  }

  if (input.existingDebt !== undefined && input.existingDebt !== null) {
    if (isNaN(input.existingDebt)) {
      errors.existingDebt = "Enter a valid amount";
    } else if (input.existingDebt < 0) {
      errors.existingDebt = "Debt cannot be negative";
    }
  }

  return errors;
}
