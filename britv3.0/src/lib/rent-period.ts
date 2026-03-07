/**
 * Rent period calculation and payment status derivation.
 * Used to determine whether rent is paid, partial, overdue, or not yet due
 * based on lease start date and rent frequency.
 */

type RentFrequency = "weekly" | "monthly";
type RentStatus = "paid" | "partial" | "overdue" | "not_due";

/**
 * Calculates the start date of the current rent period based on the lease
 * start date and payment frequency.
 *
 * For monthly: counts calendar months from lease start.
 * For weekly: counts 7-day intervals from lease start.
 *
 * Handles month-end edge cases (e.g., Jan 31 -> Feb 28 in non-leap years).
 */
export function calculateCurrentPeriodStart(
  leaseStartDate: string,
  frequency: RentFrequency
): Date {
  const now = new Date();
  const start = new Date(leaseStartDate + "T00:00:00Z");

  if (frequency === "weekly") {
    const diffMs = now.getTime() - start.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const completedWeeks = Math.floor(diffDays / 7);
    const periodStart = new Date(start);
    periodStart.setUTCDate(periodStart.getUTCDate() + completedWeeks * 7);
    return periodStart;
  }

  // Monthly frequency
  const startYear = start.getUTCFullYear();
  const startMonth = start.getUTCMonth();
  const startDay = start.getUTCDate();

  // Count months from lease start to now
  const nowYear = now.getUTCFullYear();
  const nowMonth = now.getUTCMonth();
  const totalMonths =
    (nowYear - startYear) * 12 + (nowMonth - startMonth);

  // Try the current month count, then step back if needed
  for (let m = totalMonths; m >= 0; m--) {
    const candidateDate = addMonths(startYear, startMonth, startDay, m);
    if (candidateDate.getTime() <= now.getTime()) {
      return candidateDate;
    }
  }

  return start;
}

/**
 * Adds N months to a given year/month/day, clamping to the last day
 * of the target month when the original day exceeds it.
 */
function addMonths(
  year: number,
  month: number,
  day: number,
  count: number
): Date {
  const targetMonth = month + count;
  const targetYear = year + Math.floor(targetMonth / 12);
  const targetMon = ((targetMonth % 12) + 12) % 12;

  // Get the last day of the target month
  const lastDay = new Date(
    Date.UTC(targetYear, targetMon + 1, 0)
  ).getUTCDate();
  const clampedDay = Math.min(day, lastDay);

  return new Date(Date.UTC(targetYear, targetMon, clampedDay));
}

/**
 * Derives the rent payment status for a tenancy based on payments
 * in the current rent period.
 *
 * - "paid": total payments >= rent_amount
 * - "partial": 0 < total payments < rent_amount
 * - "overdue": no payments and period has started
 * - "not_due": current date is before the first period start
 */
export function getRentStatus(
  tenancy: {
    lease_start_date: string;
    rent_amount: number;
    rent_frequency: string;
  },
  payments: ReadonlyArray<{
    category: string;
    entry_date: string;
    amount: number;
  }>
): RentStatus {
  const now = new Date();
  const leaseStart = new Date(tenancy.lease_start_date + "T00:00:00Z");

  // If lease hasn't started yet
  if (leaseStart.getTime() > now.getTime()) {
    return "not_due";
  }

  const frequency = tenancy.rent_frequency as RentFrequency;
  const periodStart = calculateCurrentPeriodStart(
    tenancy.lease_start_date,
    frequency
  );

  const periodStartStr = periodStart.toISOString().slice(0, 10);

  // Filter payments: category = 'rent' and entry_date >= periodStart
  const relevantPayments = payments.filter(
    (p) => p.category === "rent" && p.entry_date >= periodStartStr
  );

  const totalPaid = relevantPayments.reduce(
    (sum, p) => sum + p.amount,
    0
  );

  if (totalPaid >= tenancy.rent_amount) {
    return "paid";
  }

  if (totalPaid > 0) {
    return "partial";
  }

  return "overdue";
}
