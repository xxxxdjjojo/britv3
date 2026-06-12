/**
 * Tests for truedeed/late-payment (TDD RED — module not yet implemented)
 *
 * Pins the contract of @/lib/truedeed/late-payment per
 * docs/truedeed/billing-flow-gocardless.md §3 (Late Payment of Commercial
 * Debts (Interest) Act 1998). All functions are PURE — no I/O, no Date.now().
 *
 *  - REFERENCE_RATES: data, includes
 *    { referenceRate: 0.0375, validFrom: '2026-01-01', validTo: '2026-06-30' }
 *  - statutoryRateFor(dueDate): 0.08 + reference rate of the containing
 *    period → 0.1175 for H1 2026. Due date outside ALL configured periods
 *    THROWS — the constant is refreshed each Jan/July from the BoE rate and
 *    must never silently default.
 *  - dailyInterestPence(gross, dueDate): gross × rate ÷ 365 (pence, float).
 *  - interestToDatePence(gross, dueDate, asOf): whole days overdue × daily,
 *    rounded to whole pence. asOf <= dueDate → 0.
 *  - fixedSumPence (s.5A): <£1,000 → 4000p; £1,000–£9,999.99 → 7000p;
 *    >=£10,000 → 10000p.
 *  - totalNowDuePence: spec worked example — £298.80 due 12 May 2026,
 *    asOf 11 Jun 2026 (30 days): 29880 + 289 + 4000 = 34169 (£341.69).
 */

import { describe, it, expect } from "vitest";

import {
  REFERENCE_RATES,
  statutoryRateFor,
  dailyInterestPence,
  interestToDatePence,
  fixedSumPence,
  totalNowDuePence,
} from "@/lib/truedeed/late-payment";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

// Spec §3 worked example: invoice TD-2026-0147
const GROSS_PENCE = 29880; // £298.80 inc VAT (gross is the interest principal)
const DUE_DATE = "2026-05-12";
const AS_OF_30_DAYS = "2026-06-11"; // 30 whole days overdue

// ---------------------------------------------------------------------------
// 1. REFERENCE_RATES + statutoryRateFor
// ---------------------------------------------------------------------------

describe("REFERENCE_RATES", () => {
  it("contains the H1 2026 period (3.75% frozen from 31 Dec 2025)", () => {
    // Assert
    expect(REFERENCE_RATES).toContainEqual({
      referenceRate: 0.0375,
      validFrom: "2026-01-01",
      validTo: "2026-06-30",
    });
  });
});

describe("statutoryRateFor", () => {
  it("returns 8% + reference rate → 0.1175 for a debt due in H1 2026", () => {
    // Act
    const rate = statutoryRateFor(DUE_DATE);

    // Assert
    expect(rate).toBeCloseTo(0.1175, 10);
  });

  it("includes the period boundaries: validFrom and validTo days both resolve", () => {
    // Act + Assert
    expect(statutoryRateFor("2026-01-01")).toBeCloseTo(0.1175, 10);
    expect(statutoryRateFor("2026-06-30")).toBeCloseTo(0.1175, 10);
  });

  it("throws for a due date outside all configured periods (never silently defaults)", () => {
    // Arrange — far before any plausible configured period
    const ancientDueDate = "1990-01-01";

    // Act + Assert
    expect(() => statutoryRateFor(ancientDueDate)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// 2. dailyInterestPence
// ---------------------------------------------------------------------------

describe("dailyInterestPence", () => {
  it("£298.80 at 11.75%: 29880 × 0.1175 ÷ 365 = 9.6189… pence/day", () => {
    // Act
    const daily = dailyInterestPence(GROSS_PENCE, DUE_DATE);

    // Assert — spec quotes £0.0962/day; pinned as pence float
    expect(daily).toBeCloseTo(9.62, 2);
  });
});

// ---------------------------------------------------------------------------
// 3. interestToDatePence
// ---------------------------------------------------------------------------

describe("interestToDatePence", () => {
  it("spec worked example: due 2026-05-12, asOf 2026-06-11 (30 days) → 289 pence (£2.89)", () => {
    // Act
    const interest = interestToDatePence(GROSS_PENCE, DUE_DATE, AS_OF_30_DAYS);

    // Assert — 29880 × 0.1175 × 30/365 = 288.567 → 289 whole pence
    expect(interest).toBe(289);
  });

  it("returns 0 when asOf is before the due date", () => {
    // Act
    const interest = interestToDatePence(GROSS_PENCE, DUE_DATE, "2026-05-01");

    // Assert
    expect(interest).toBe(0);
  });

  it("returns 0 when asOf equals the due date (not yet overdue)", () => {
    // Act
    const interest = interestToDatePence(GROSS_PENCE, DUE_DATE, DUE_DATE);

    // Assert
    expect(interest).toBe(0);
  });

  it("counts whole days: asOf = dueDate + 1 → exactly 1 day (9.6189 → 10 pence)", () => {
    // Act
    const interest = interestToDatePence(GROSS_PENCE, DUE_DATE, "2026-05-13");

    // Assert
    expect(interest).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// 4. fixedSumPence (s.5A)
// ---------------------------------------------------------------------------

describe("fixedSumPence", () => {
  it("debt under £1,000 → £40 (4000 pence): the £298.80 success fee", () => {
    // Act + Assert
    expect(fixedSumPence(GROSS_PENCE)).toBe(4000);
  });

  it("boundary: 99999 pence (£999.99) → 4000 pence", () => {
    // Act + Assert
    expect(fixedSumPence(99999)).toBe(4000);
  });

  it("boundary: 100000 pence (£1,000.00) → £70 (7000 pence)", () => {
    // Act + Assert
    expect(fixedSumPence(100000)).toBe(7000);
  });

  it("boundary: 999999 pence (£9,999.99) → 7000 pence", () => {
    // Act + Assert
    expect(fixedSumPence(999999)).toBe(7000);
  });

  it("boundary: 1000000 pence (£10,000.00) → £100 (10000 pence)", () => {
    // Act + Assert
    expect(fixedSumPence(1000000)).toBe(10000);
  });
});

// ---------------------------------------------------------------------------
// 5. totalNowDuePence — full worked example
// ---------------------------------------------------------------------------

describe("totalNowDuePence", () => {
  it("spec worked example: £298.80 + £2.89 + £40.00 = £341.69 (34169 pence)", () => {
    // Act
    const result = totalNowDuePence(GROSS_PENCE, DUE_DATE, AS_OF_30_DAYS);

    // Assert
    expect(result).toEqual({
      interestPence: 289,
      fixedSumPence: 4000,
      totalPence: 34169,
    });
  });

  it("not yet overdue: zero interest but principal + fixed sum structure intact", () => {
    // Act
    const result = totalNowDuePence(GROSS_PENCE, DUE_DATE, DUE_DATE);

    // Assert
    expect(result.interestPence).toBe(0);
    expect(result.totalPence).toBe(GROSS_PENCE + result.fixedSumPence);
  });
});
