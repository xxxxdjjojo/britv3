/**
 * Rental cost utilities — pure, framework-agnostic helpers for the
 * "Total to move in" breakdown and income-needed line on rental detail pages.
 *
 * All functions are deterministic and side-effect free.
 * Re-uses monthlyToWeekly / WEEKS_PER_MONTH from rental-format.ts to avoid
 * duplicating the weekly-rent derivation.
 */

import { monthlyToWeekly } from "./rental-format";

// ─── Re-export ───────────────────────────────────────────────────────────────

/**
 * Weekly rent derived from monthly rent (52/12 conversion, rounded to 2dp).
 * Returns null for non-positive or missing input.
 * Delegates to monthlyToWeekly — no duplication of the weekly math.
 */
export function perWeek(monthlyRent: number | null | undefined): number | null {
  return monthlyToWeekly(monthlyRent);
}

// ─── Per-room ─────────────────────────────────────────────────────────────────

/**
 * Monthly rent divided equally across bedrooms.
 * Returns null for studios (beds < 1), non-positive rent, or missing inputs.
 */
export function perRoom(
  monthlyRent: number | null | undefined,
  beds: number | null | undefined,
): number | null {
  if (typeof monthlyRent !== "number" || monthlyRent <= 0) return null;
  if (typeof beds !== "number" || beds < 1) return null;
  return Math.round(monthlyRent / beds);
}

// ─── Move-in cost ─────────────────────────────────────────────────────────────

export type MoveInCost = {
  /** First month's rent (rent due on move-in day) */
  firstMonthRent: number;
  /** Security deposit */
  deposit: number;
  /** Holding deposit (typically 1 week's rent) */
  holdingDeposit: number;
  /** Cash required before/on move-in day */
  totalUpfront: number;
};

/**
 * Break down the upfront cash a tenant must have ready on move-in day.
 *
 * Note: the spec adds holdingDeposit on top of firstMonthRent + deposit.
 * In practice, some landlords deduct the holding deposit from the security
 * deposit on signing — but this function implements the spec's sum as
 * "maximum possible upfront exposure", which is the conservative and
 * tenant-informative figure.
 */
export function moveInCost(input: {
  monthlyRent: number;
  deposit?: number | null;
  holdingDeposit?: number | null;
}): MoveInCost {
  const firstMonthRent = Math.max(0, Math.round(input.monthlyRent));
  const deposit = Math.max(0, Math.round(input.deposit ?? 0));
  const holdingDeposit = Math.max(0, Math.round(input.holdingDeposit ?? 0));
  const totalUpfront = firstMonthRent + deposit + holdingDeposit;

  return { firstMonthRent, deposit, holdingDeposit, totalUpfront };
}

// ─── Income needed ────────────────────────────────────────────────────────────

/**
 * Standard UK letting-referencing affordability multiple.
 * Landlords and referencing agencies typically require annual gross income
 * of at least 30 × monthly rent (equivalent to 2.5 × annual rent).
 *
 * This mirrors the affordability principle used by the rent-affordability
 * calculator (rent should be a sustainable fraction of income) and is
 * guidance only — not a guarantee of referencing approval.
 */
export const RENT_INCOME_ANNUAL_MULTIPLE = 30;

/**
 * Minimum annual gross income typically required by UK referencing agencies.
 * Returns 0 for non-positive or missing input.
 */
export function incomeNeededAnnual(monthlyRent: number | null | undefined): number {
  if (typeof monthlyRent !== "number" || monthlyRent <= 0) return 0;
  return Math.max(0, Math.round(monthlyRent * RENT_INCOME_ANNUAL_MULTIPLE));
}

/**
 * Monthly equivalent of the annual income needed (incomeNeededAnnual ÷ 12).
 * Returns 0 for non-positive or missing input.
 */
export function incomeNeededMonthly(monthlyRent: number | null | undefined): number {
  return Math.max(0, Math.round(incomeNeededAnnual(monthlyRent) / 12));
}

// ─── Deposit cap (Tenant Fees Act 2019) ──────────────────────────────────────

/**
 * Tenant Fees Act 2019 caps the security deposit at 5 weeks' rent
 * (or 6 weeks if the annual rent is £50,000 or more).
 *
 * Reference: Tenant Fees Act 2019 s.3 and Schedule 1.
 */
export const DEPOSIT_CAP_WEEKS_STANDARD = 5; // annual rent < £50,000
export const DEPOSIT_CAP_WEEKS_HIGH = 6;     // annual rent >= £50,000
export const DEPOSIT_CAP_HIGH_RENT_ANNUAL = 50_000;

export type DepositCap = {
  /** Number of weeks used as the cap (5 or 6) */
  capWeeks: number;
  /** Maximum deposit amount in GBP (rounded) */
  capAmount: number;
  /** true only if a deposit was provided AND it strictly exceeds capAmount */
  exceeds: boolean;
};

/**
 * Calculate the Tenant Fees Act 2019 deposit cap for a given monthly rent.
 *
 * Both sides are rounded before comparison so small rounding differences
 * (e.g. ±£1) do not falsely trip the exceeds flag.
 */
export function depositCap(
  monthlyRent: number | null | undefined,
  deposit?: number | null,
): DepositCap {
  const weekly = monthlyToWeekly(monthlyRent) ?? 0;
  const annualRent = typeof monthlyRent === "number" && monthlyRent > 0
    ? monthlyRent * 12
    : 0;

  const capWeeks =
    annualRent >= DEPOSIT_CAP_HIGH_RENT_ANNUAL
      ? DEPOSIT_CAP_WEEKS_HIGH
      : DEPOSIT_CAP_WEEKS_STANDARD;

  const capAmount = Math.round(capWeeks * weekly);

  const roundedDeposit = deposit != null ? Math.round(deposit) : null;
  // Only flag as exceeds when we have a valid cap (capAmount > 0) and a deposit to compare
  const exceeds = capAmount > 0 && roundedDeposit != null && roundedDeposit > capAmount;

  return { capWeeks, capAmount, exceeds };
}
