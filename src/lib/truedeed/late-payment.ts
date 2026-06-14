/**
 * Truedeed statutory late-payment arithmetic (billing spec §3).
 *
 * Late Payment of Commercial Debts (Interest) Act 1998 (as amended),
 * incorporated unmodified into Network Agreement clause 9. Pure functions —
 * no I/O, no Date.now(); callers pass dates as "YYYY-MM-DD" strings.
 *
 *  - Rate: 8% + the BoE reference rate, frozen twice yearly (31 Dec rate
 *    applies to debts overdue 1 Jan–30 Jun; 30 Jun rate applies 1 Jul–31 Dec).
 *  - Principal: gross invoice amount including VAT; interest is not VATable.
 *  - Fixed sum (s.5A): £40 / £70 / £100 by debt size, once per invoice.
 */

/** One twice-yearly frozen BoE reference-rate period (spec §3). */
export type ReferenceRatePeriod = {
  /** BoE base rate frozen at the period boundary, as a decimal (0.0375 = 3.75%). */
  referenceRate: number;
  /** First due date covered, inclusive ("YYYY-MM-DD"). */
  validFrom: string;
  /** Last due date covered, inclusive ("YYYY-MM-DD"). */
  validTo: string;
};

const STATUTORY_UPLIFT = 0.08; // s.6 rate: 8% over the reference rate
const DAYS_PER_YEAR = 365;
const MS_PER_DAY = 86_400_000;

// s.5A(1) fixed-sum bands, in pence.
const FIXED_SUM_SMALL_PENCE = 4000; // £40 — debt under £1,000
const FIXED_SUM_MEDIUM_PENCE = 7000; // £70 — £1,000 to £9,999.99
const FIXED_SUM_LARGE_PENCE = 10000; // £100 — £10,000 and over
const MEDIUM_DEBT_THRESHOLD_PENCE = 100_000; // £1,000.00
const LARGE_DEBT_THRESHOLD_PENCE = 1_000_000; // £10,000.00

/**
 * Twice-yearly frozen BoE reference rates (spec §3). Refreshed each
 * January/July from the published BoE rate — data, never hardcoded in
 * templates. A due date outside every period must THROW, never default.
 */
export const REFERENCE_RATES: readonly ReferenceRatePeriod[] = [
  // Base 3.75% since Dec 2025; 31 Dec 2025 rate fixes H1 2026.
  { referenceRate: 0.0375, validFrom: "2026-01-01", validTo: "2026-06-30" },
];

/**
 * Statutory rate (decimal per annum) for a debt with the given due date:
 * 8% + the reference rate of the containing period (spec §3).
 *
 * @throws Error when the due date falls outside all configured periods —
 *   the constant is refreshed each Jan/July and must never silently default.
 */
export function statutoryRateFor(dueDate: string): number {
  const period = REFERENCE_RATES.find(
    (p) => dueDate >= p.validFrom && dueDate <= p.validTo,
  );
  if (!period) {
    throw new Error(
      `No statutory reference rate configured for due date ${dueDate} — refresh REFERENCE_RATES from the BoE published rate`,
    );
  }
  return STATUTORY_UPLIFT + period.referenceRate;
}

/**
 * Daily interest in pence (float, unrounded): gross × rate ÷ 365 (spec §3).
 * E.g. £298.80 at 11.75% → 9.6189… pence/day (£0.0962/day).
 */
export function dailyInterestPence(
  grossPence: number,
  dueDate: string,
): number {
  return (grossPence * statutoryRateFor(dueDate)) / DAYS_PER_YEAR;
}

/** Whole days between two "YYYY-MM-DD" dates (UTC midnights). */
function wholeDaysBetween(fromDate: string, toDate: string): number {
  return Math.floor((Date.parse(toDate) - Date.parse(fromDate)) / MS_PER_DAY);
}

/**
 * Interest accrued to `asOf`, rounded to whole pence (spec §3 worked example:
 * 29880 × 0.1175 × 30/365 = 288.567 → 289). Whole days overdue × daily rate;
 * asOf on or before the due date → 0 (not yet overdue).
 */
export function interestToDatePence(
  grossPence: number,
  dueDate: string,
  asOf: string,
): number {
  const daysOverdue = wholeDaysBetween(dueDate, asOf);
  if (daysOverdue <= 0) {
    return 0;
  }
  return Math.round(daysOverdue * dailyInterestPence(grossPence, dueDate));
}

/**
 * Fixed sum under s.5A, in pence: <£1,000 → £40; £1,000–£9,999.99 → £70;
 * ≥£10,000 → £100. Once per invoice, on the day it becomes overdue (spec §3).
 */
export function fixedSumPence(grossPence: number): number {
  if (grossPence < MEDIUM_DEBT_THRESHOLD_PENCE) {
    return FIXED_SUM_SMALL_PENCE;
  }
  if (grossPence < LARGE_DEBT_THRESHOLD_PENCE) {
    return FIXED_SUM_MEDIUM_PENCE;
  }
  return FIXED_SUM_LARGE_PENCE;
}

/** Breakdown of the amount now due (spec §3 worked example / Email 3). */
export type TotalNowDue = {
  interestPence: number;
  fixedSumPence: number;
  totalPence: number;
};

/**
 * Total now due (spec §3 worked example): principal + statutory interest to
 * date + s.5A fixed sum. £298.80 due 12 May 2026, asOf 11 Jun 2026 →
 * 29880 + 289 + 4000 = 34169 (£341.69).
 */
export function totalNowDuePence(
  grossPence: number,
  dueDate: string,
  asOf: string,
): TotalNowDue {
  const interestPence = interestToDatePence(grossPence, dueDate, asOf);
  const fixedSum = fixedSumPence(grossPence);
  return {
    interestPence,
    fixedSumPence: fixedSum,
    totalPence: grossPence + interestPence + fixedSum,
  };
}
