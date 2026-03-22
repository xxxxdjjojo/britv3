/**
 * Yield calculator -- pure functions for computing gross and net rental yields.
 * No Supabase dependency; safe for client-side use.
 *
 * Gross yield: (annual_rent / property_value) * 100
 * Net yield:   ((annual_rent - annual_costs) / property_value) * 100
 */

export type YieldInputs = {
  propertyValue: number;
  monthlyRent: number;
  monthlyManagementFee: number;
  monthlyMaintenance: number;
  monthlyInsurance: number;
  monthlyMortgage: number;
};

export type YieldResult = {
  grossYield: number;
  netYield: number;
  annualRent: number;
  annualCosts: number;
  annualNet: number;
};

/**
 * Calculate gross and net rental yield percentages.
 * Returns 0 for both yields if propertyValue is 0 (avoids divide-by-zero).
 * Results are rounded to 2 decimal places.
 */
export function calculateYield(inputs: YieldInputs): YieldResult {
  const {
    propertyValue,
    monthlyRent,
    monthlyManagementFee,
    monthlyMaintenance,
    monthlyInsurance,
    monthlyMortgage,
  } = inputs;

  if (propertyValue === 0) {
    return { grossYield: 0, netYield: 0, annualRent: 0, annualCosts: 0, annualNet: 0 };
  }

  const annualRent = monthlyRent * 12;
  const annualCosts =
    (monthlyManagementFee + monthlyMaintenance + monthlyInsurance + monthlyMortgage) * 12;

  const grossYield = parseFloat(((annualRent / propertyValue) * 100).toFixed(2));
  const netYield = parseFloat((((annualRent - annualCosts) / propertyValue) * 100).toFixed(2));
  const annualNet = annualRent - annualCosts;

  return { grossYield, netYield, annualRent, annualCosts, annualNet };
}

// -- Portfolio analytics extensions -------------------------------------------

/** Safe division — returns null if divisor is 0 or inputs are NaN */
export function safeDivide(numerator: number, denominator: number): number | null {
  if (denominator === 0 || !Number.isFinite(numerator) || !Number.isFinite(denominator)) {
    return null;
  }
  return numerator / denominator;
}

/** Monthly cashflow = income - expenses */
export function calcCashflow(monthlyIncome: number, monthlyExpenses: number): number {
  return monthlyIncome - monthlyExpenses;
}

/** Occupancy rate as percentage */
export function calcOccupancyRate(occupied: number, total: number): number {
  if (total === 0) return 0;
  const result = safeDivide(occupied, total);
  return result !== null ? Math.round(result * 100 * 10) / 10 : 0;
}

/** Format a number or null as a display string */
export function formatMetric(value: number | null, suffix = "%"): string {
  if (value === null) return "\u2014";
  return `${value}${suffix}`;
}
