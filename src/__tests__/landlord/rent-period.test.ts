import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getRentStatus,
  calculateCurrentPeriodStart,
} from "@/lib/rent-period";

describe("calculateCurrentPeriodStart", () => {
  beforeEach(() => {
    // Fix "now" to 2026-03-07
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-07T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("handles monthly frequency correctly", () => {
    // Lease started 2026-01-01, monthly. Periods: Jan 1, Feb 1, Mar 1
    // Current date is Mar 7 -> current period start is Mar 1
    const result = calculateCurrentPeriodStart("2026-01-01", "monthly");
    expect(result.toISOString().slice(0, 10)).toBe("2026-03-01");
  });

  it("handles weekly frequency correctly", () => {
    // Lease started 2026-02-02 (Monday), weekly.
    // Feb 2, 9, 16, 23, Mar 2 -> Mar 2 is the most recent period start before Mar 7
    const result = calculateCurrentPeriodStart("2026-02-02", "weekly");
    expect(result.toISOString().slice(0, 10)).toBe("2026-03-02");
  });

  it("returns lease start date if current date is within first period (monthly)", () => {
    // Lease started 2026-03-01, monthly. Current date Mar 7 is in first period.
    const result = calculateCurrentPeriodStart("2026-03-01", "monthly");
    expect(result.toISOString().slice(0, 10)).toBe("2026-03-01");
  });

  it("returns lease start date if current date is within first period (weekly)", () => {
    // Lease started 2026-03-05, weekly. Current date Mar 7 is in first week.
    const result = calculateCurrentPeriodStart("2026-03-05", "weekly");
    expect(result.toISOString().slice(0, 10)).toBe("2026-03-05");
  });

  it("handles Feb 29 leap year for monthly frequency", () => {
    // Lease started 2024-01-29, monthly. By Mar 2026, many months have passed.
    // Jan 29, Feb 28/29, Mar 29, ... each month rolls forward
    // Current date is 2026-03-07 -> period start should be 2026-02-28 (since Jan has 29th but Feb doesn't in 2026)
    // Actually for monthly: we count full months. Jan 29 + 25 months = Feb 28, 2026 (non-leap)
    // The current period that contains Mar 7 would be Feb 28 start (next would be Mar 29)
    const result = calculateCurrentPeriodStart("2024-01-29", "monthly");
    expect(result.toISOString().slice(0, 10)).toBe("2026-02-28");
  });

  it("handles lease starting Jan 31 with monthly frequency", () => {
    // Lease started 2026-01-31, monthly.
    // Jan 31 -> Feb 28 (no 31st) -> Mar 31
    // Current date Mar 7 -> period start is Feb 28
    const result = calculateCurrentPeriodStart("2026-01-31", "monthly");
    expect(result.toISOString().slice(0, 10)).toBe("2026-02-28");
  });
});

describe("getRentStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-07T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const baseTenancy = {
    lease_start_date: "2026-01-01",
    rent_amount: 1000,
    rent_frequency: "monthly" as const,
  };

  it('returns "paid" when payment >= rent_amount in current period', () => {
    const payments = [
      { category: "rent", entry_date: "2026-03-03", amount: 1000 },
    ];
    expect(getRentStatus(baseTenancy, payments)).toBe("paid");
  });

  it('returns "paid" when multiple payments sum to >= rent_amount', () => {
    const payments = [
      { category: "rent", entry_date: "2026-03-01", amount: 500 },
      { category: "rent", entry_date: "2026-03-05", amount: 600 },
    ];
    expect(getRentStatus(baseTenancy, payments)).toBe("paid");
  });

  it('returns "partial" when 0 < payment < rent_amount', () => {
    const payments = [
      { category: "rent", entry_date: "2026-03-02", amount: 500 },
    ];
    expect(getRentStatus(baseTenancy, payments)).toBe("partial");
  });

  it('returns "overdue" when no payment and period has started', () => {
    expect(getRentStatus(baseTenancy, [])).toBe("overdue");
  });

  it('returns "not_due" when current date is before period start', () => {
    const futureTenancy = {
      lease_start_date: "2026-04-01",
      rent_amount: 1000,
      rent_frequency: "monthly" as const,
    };
    expect(getRentStatus(futureTenancy, [])).toBe("not_due");
  });

  it("ignores non-rent category payments", () => {
    const payments = [
      { category: "deposit", entry_date: "2026-03-03", amount: 2000 },
    ];
    expect(getRentStatus(baseTenancy, payments)).toBe("overdue");
  });

  it("ignores payments from previous periods", () => {
    const payments = [
      { category: "rent", entry_date: "2026-02-15", amount: 1000 },
    ];
    expect(getRentStatus(baseTenancy, payments)).toBe("overdue");
  });

  it("handles weekly frequency correctly", () => {
    const weeklyTenancy = {
      lease_start_date: "2026-02-02",
      rent_amount: 250,
      rent_frequency: "weekly" as const,
    };
    // Current period starts Mar 2 for weekly
    const payments = [
      { category: "rent", entry_date: "2026-03-03", amount: 250 },
    ];
    expect(getRentStatus(weeklyTenancy, payments)).toBe("paid");
  });
});
