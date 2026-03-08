import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getRentStatus, calculateCurrentPeriodStart } from "@/lib/rent-period";

describe("getRentStatus", () => {
  beforeEach(() => {
    // Fix "now" to 2026-03-15 for deterministic tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const baseTenancy = {
    lease_start_date: "2026-01-01",
    rent_amount: 1200,
    rent_frequency: "monthly",
  };

  it("returns 'paid' when total payments >= rent amount", () => {
    const payments = [
      { category: "rent", entry_date: "2026-03-01", amount: 1200 },
    ];
    expect(getRentStatus(baseTenancy, payments)).toBe("paid");
  });

  it("returns 'paid' when multiple payments total >= rent amount", () => {
    const payments = [
      { category: "rent", entry_date: "2026-03-01", amount: 600 },
      { category: "rent", entry_date: "2026-03-05", amount: 600 },
    ];
    expect(getRentStatus(baseTenancy, payments)).toBe("paid");
  });

  it("returns 'paid' when overpaid", () => {
    const payments = [
      { category: "rent", entry_date: "2026-03-01", amount: 1500 },
    ];
    expect(getRentStatus(baseTenancy, payments)).toBe("paid");
  });

  it("returns 'partial' when 0 < total < rent amount", () => {
    const payments = [
      { category: "rent", entry_date: "2026-03-01", amount: 800 },
    ];
    expect(getRentStatus(baseTenancy, payments)).toBe("partial");
  });

  it("returns 'overdue' when no payments in current period", () => {
    const payments: { category: string; entry_date: string; amount: number }[] = [];
    expect(getRentStatus(baseTenancy, payments)).toBe("overdue");
  });

  it("returns 'overdue' when only non-rent payments exist", () => {
    const payments = [
      { category: "deposit", entry_date: "2026-03-01", amount: 1200 },
    ];
    expect(getRentStatus(baseTenancy, payments)).toBe("overdue");
  });

  it("returns 'not_due' when lease hasn't started yet", () => {
    const futureTenancy = {
      ...baseTenancy,
      lease_start_date: "2026-04-01",
    };
    expect(getRentStatus(futureTenancy, [])).toBe("not_due");
  });

  it("ignores payments from previous period", () => {
    const payments = [
      { category: "rent", entry_date: "2026-02-01", amount: 1200 },
    ];
    expect(getRentStatus(baseTenancy, payments)).toBe("overdue");
  });

  it("handles weekly frequency", () => {
    const weeklyTenancy = {
      lease_start_date: "2026-03-09",
      rent_amount: 300,
      rent_frequency: "weekly",
    };
    const payments = [
      { category: "rent", entry_date: "2026-03-09", amount: 300 },
    ];
    expect(getRentStatus(weeklyTenancy, payments)).toBe("paid");
  });
});

describe("calculateCurrentPeriodStart", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns correct monthly period start", () => {
    const result = calculateCurrentPeriodStart("2026-01-01", "monthly");
    expect(result.toISOString().slice(0, 10)).toBe("2026-03-01");
  });

  it("handles month-end clamping (Jan 31 -> Feb 28)", () => {
    // When now is March 15 and lease started Jan 31:
    // m=2 candidate: Mar 31 (after now) -> skip
    // m=1 candidate: Feb 28 (before now) -> this is current period start
    vi.setSystemTime(new Date("2026-03-15T12:00:00Z"));
    const result = calculateCurrentPeriodStart("2026-01-31", "monthly");
    expect(result.toISOString().slice(0, 10)).toBe("2026-02-28");
  });

  it("returns correct weekly period start", () => {
    const result = calculateCurrentPeriodStart("2026-03-02", "weekly");
    // March 2 + 7 = March 9, + 7 = March 16 (after now=March 15)
    // So current period starts on March 9
    expect(result.toISOString().slice(0, 10)).toBe("2026-03-09");
  });
});
