/**
 * Currency utilities for GBP/pence conversion.
 *
 * IMPORTANT: All monetary amounts stored in the database (offers.amount,
 * and other financial columns) are stored as INTEGER PENCE.
 * Always call penceToGBP() when reading and GBPToPence() when writing.
 */

/**
 * Convert pence (integer) to GBP (decimal).
 * e.g. 125000p → £1,250.00
 */
export function penceToGBP(pence: number): number {
  return pence / 100;
}

/**
 * Convert GBP (decimal) to pence (integer).
 * e.g. £1,250.00 → 125000p
 */
export function GBPToPence(gbp: number): number {
  return Math.round(gbp * 100);
}

/**
 * Format pence as a GBP string with £ symbol and comma separators.
 * e.g. 125000 → "£1,250.00"
 */
export function formatPenceAsGBP(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(penceToGBP(pence));
}
