/**
 * England & Wales business-day utilities (Truedeed Phase 1).
 *
 * `getEnglandWalesBankHolidays()` fetches the official gov.uk bank-holiday
 * feed, extracts the england-and-wales division, and caches the dates in
 * Upstash for 7 days. On any failure (network error, non-OK response,
 * malformed payload) it falls back to the bundled JSON snapshot — it never
 * throws, because rebuttal-deadline computation must always succeed.
 *
 * `addBusinessDays()` / `isBusinessDay()` are pure and synchronous with
 * holidays injected, so deadline maths is deterministic and unit-testable.
 * All date arithmetic is UTC-based.
 */

import { getCached, setCache } from "@/lib/cache/redis";
import snapshot from "@/lib/bank-holidays-snapshot.json";

const GOV_UK_BANK_HOLIDAYS_URL = "https://www.gov.uk/bank-holidays.json";
const CACHE_KEY = "bank-holidays:england-and-wales";
const CACHE_TTL_SECONDS = 604800; // 7 days
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type GovUkEvent = { date?: unknown };
type GovUkDivision = { events?: unknown };

/**
 * Returns England & Wales bank holidays as "YYYY-MM-DD" strings.
 * Cache → gov.uk fetch → bundled snapshot fallback. Never throws.
 */
export async function getEnglandWalesBankHolidays(): Promise<string[]> {
  try {
    const cached = await getCached<string[]>(CACHE_KEY);
    if (Array.isArray(cached) && cached.length > 0) {
      return cached;
    }

    const response = await fetch(GOV_UK_BANK_HOLIDAYS_URL);
    if (!response.ok) {
      return [...snapshot];
    }

    const payload = (await response.json()) as Record<string, GovUkDivision>;
    const events = payload?.["england-and-wales"]?.events;
    if (!Array.isArray(events)) {
      return [...snapshot];
    }

    const dates = (events as GovUkEvent[])
      .map((event) => String(event?.date ?? ""))
      .filter((date) => ISO_DATE_RE.test(date));

    if (dates.length === 0) {
      return [...snapshot];
    }

    await setCache(CACHE_KEY, dates, CACHE_TTL_SECONDS);
    return dates;
  } catch {
    return [...snapshot];
  }
}

/**
 * True when the date (UTC calendar day) is neither a weekend nor one of the
 * injected "YYYY-MM-DD" holidays.
 */
export function isBusinessDay(
  date: Date,
  holidays: readonly string[],
): boolean {
  const dayOfWeek = date.getUTCDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }
  return !holidays.includes(date.toISOString().slice(0, 10));
}

/**
 * Adds `days` business days to `date`, skipping Saturdays, Sundays, and the
 * injected holidays. Pure — returns a new Date, never mutates the input.
 * `days` must be >= 0; +0 returns the same calendar day.
 */
export function addBusinessDays(
  date: Date,
  days: number,
  holidays: readonly string[],
): Date {
  if (days < 0 || !Number.isInteger(days)) {
    throw new Error("addBusinessDays requires a non-negative integer day count");
  }

  const result = new Date(date.getTime());
  let remaining = days;

  while (remaining > 0) {
    result.setUTCDate(result.getUTCDate() + 1);
    if (isBusinessDay(result, holidays)) {
      remaining -= 1;
    }
  }

  return result;
}
