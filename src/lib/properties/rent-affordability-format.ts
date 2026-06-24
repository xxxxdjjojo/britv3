/**
 * Shared formatting + parsing helpers for the rent affordability calculator.
 *
 * GBP-only (TrueDeed is UK-only). A single module-level Intl.NumberFormat is
 * reused across all calculator components rather than re-instantiated per render.
 */

const gbpWhole = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Format a number as a whole-pound GBP string, e.g. 1200 -> "£1,200". */
export function formatGBP(value: number): string {
  return gbpWhole.format(Math.round(value));
}

/** Parse a user-entered string into a non-negative number (blank/NaN -> 0). */
export function parseNum(value: string): number {
  if (value === "") return 0;
  const n = parseFloat(value);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, n);
}
