/**
 * Currency utilities for TrueDeed.
 *
 * Offer amounts, property prices and monetary values are stored in pence
 * (integer) in the database to avoid floating-point rounding issues.
 * Use these helpers to convert between pence and GBP at the UI boundary.
 */

/**
 * Convert a pence integer from the database to a GBP float.
 * e.g. penceToGBP(125000) → 1250.00
 */
export function penceToGBP(pence: number): number {
  return pence / 100;
}

/**
 * Convert a GBP float to a pence integer for storage in the database.
 * e.g. gbpToPence(1250.50) → 125050
 */
export function gbpToPence(gbp: number): number {
  return Math.round(gbp * 100);
}
