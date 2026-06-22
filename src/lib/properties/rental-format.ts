/**
 * Rental-specific formatting utilities.
 *
 * Weekly rent is DERIVED from monthly rent using the standard UK conversion:
 *   weekly = monthly / 4.345  (52 weeks / 12 months)
 *
 * One tested utility for derivation — no stored weekly price column needed.
 */

/** weeks per month (52/52 * 12) — standard UK lettings conversion */
export const WEEKS_PER_MONTH = 52 / 12; // ≈ 4.3333

/**
 * Derive weekly rent from a monthly amount.
 * Returns null if the input is not a positive number.
 */
export function monthlyToWeekly(monthly: number | null | undefined): number | null {
  if (typeof monthly !== "number" || monthly <= 0) return null;
  return Math.round((monthly / WEEKS_PER_MONTH) * 100) / 100;
}

/**
 * Format a monthly rent amount as a GBP string with pcm suffix.
 */
export function formatMonthlyRent(monthly: number | null | undefined): string {
  if (typeof monthly !== "number" || monthly <= 0) return "Price on application";
  return `£${monthly.toLocaleString("en-GB")} pcm`;
}

/**
 * Format a weekly rent amount as a GBP string with pw suffix.
 */
export function formatWeeklyRent(weekly: number | null | undefined): string {
  if (typeof weekly !== "number" || weekly <= 0) return "";
  return `£${weekly.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} pw`;
}

/**
 * Human-readable label for a furnishing enum value.
 */
export function furnishingLabel(furnishing: string | null | undefined): string {
  switch (furnishing) {
    case "furnished":
      return "Furnished";
    case "unfurnished":
      return "Unfurnished";
    case "part_furnished":
      return "Part furnished";
    default:
      return "";
  }
}

/**
 * Human-readable label for a pets policy enum value.
 */
export function petsPolicyLabel(policy: string | null | undefined): string {
  switch (policy) {
    case "allowed":
      return "Pets allowed";
    case "not_allowed":
      return "No pets";
    case "by_arrangement":
      return "Pets by arrangement";
    default:
      return "";
  }
}

/**
 * Human-readable label for a students policy enum value.
 */
export function studentsPolicyLabel(policy: string | null | undefined): string {
  switch (policy) {
    case "accepted":
      return "Students accepted";
    case "not_accepted":
      return "Students not accepted";
    case "by_arrangement":
      return "Students by arrangement";
    default:
      return "";
  }
}

/**
 * Format an available-from date as a UK date string.
 */
export function formatAvailableFrom(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
