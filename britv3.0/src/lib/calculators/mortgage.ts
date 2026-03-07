/**
 * Pure mortgage calculation functions
 *
 * Uses standard amortization formula:
 *   M = P * [r(1+r)^n] / [(1+r)^n - 1]
 *
 * Where:
 *   M = monthly payment
 *   P = principal (loan amount)
 *   r = monthly interest rate (annual rate / 12 / 100)
 *   n = total number of payments (years * 12)
 */

import type { MortgageResult } from "@/types/calculators";

/**
 * Calculate monthly mortgage payment.
 *
 * @param principal - Loan amount in GBP
 * @param annualRate - Annual interest rate as percentage (e.g. 5 for 5%)
 * @param termYears - Mortgage term in years
 * @returns Monthly payment rounded to 2 decimal places
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termYears: number,
): number {
  if (principal <= 0 || termYears <= 0) {
    return 0;
  }

  const totalPayments = termYears * 12;

  // Zero interest edge case: simple division
  if (annualRate === 0) {
    return Math.round((principal / totalPayments) * 100) / 100;
  }

  const monthlyRate = annualRate / 100 / 12;
  const compoundFactor = Math.pow(1 + monthlyRate, totalPayments);
  const payment = principal * (monthlyRate * compoundFactor) / (compoundFactor - 1);

  return Math.round(payment * 100) / 100;
}

/**
 * Calculate total repayable amount and total interest paid.
 *
 * @param principal - Loan amount in GBP
 * @param annualRate - Annual interest rate as percentage
 * @param termYears - Mortgage term in years
 * @returns Object with totalRepayable and totalInterest
 */
export function calculateTotalRepayable(
  principal: number,
  annualRate: number,
  termYears: number,
): { totalRepayable: number; totalInterest: number } {
  const monthly = calculateMonthlyPayment(principal, annualRate, termYears);
  const totalPayments = termYears * 12;
  const totalRepayable = Math.round(monthly * totalPayments * 100) / 100;
  const totalInterest = Math.round((totalRepayable - principal) * 100) / 100;

  return { totalRepayable, totalInterest };
}

/**
 * Calculate affordability for a property given price and deposit.
 *
 * @param propertyPrice - Property price in GBP
 * @param deposit - Deposit amount in GBP
 * @param annualRate - Annual interest rate as percentage
 * @param termYears - Mortgage term in years
 * @returns Full mortgage result with monthly payment, total repayable, and interest
 */
export function calculateAffordability(
  propertyPrice: number,
  deposit: number,
  annualRate: number,
  termYears: number,
): MortgageResult {
  const principal = Math.max(0, propertyPrice - deposit);
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termYears);
  const { totalRepayable, totalInterest } = calculateTotalRepayable(
    principal,
    annualRate,
    termYears,
  );

  return { monthlyPayment, totalRepayable, totalInterest };
}
