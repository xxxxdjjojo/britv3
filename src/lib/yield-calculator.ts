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
    return { grossYield: 0, netYield: 0 };
  }

  const annualRent = monthlyRent * 12;
  const annualCosts =
    (monthlyManagementFee + monthlyMaintenance + monthlyInsurance + monthlyMortgage) * 12;

  const grossYield = parseFloat(((annualRent / propertyValue) * 100).toFixed(2));
  const netYield = parseFloat((((annualRent - annualCosts) / propertyValue) * 100).toFixed(2));

  return { grossYield, netYield };
}
