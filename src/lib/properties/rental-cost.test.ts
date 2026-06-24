import { describe, expect, it } from "vitest";
import {
  depositCap,
  incomeNeededAnnual,
  incomeNeededMonthly,
  moveInCost,
  perRoom,
  perWeek,
} from "./rental-cost";

describe("perWeek", () => {
  it("returns weekly rent derived from monthly rent", () => {
    // 2200 / (52/12) = 507.6923…  → rounds to 507.69
    expect(perWeek(2200)).toBe(507.69);
  });

  it("returns null for zero monthly rent", () => {
    expect(perWeek(0)).toBeNull();
  });

  it("returns null for negative monthly rent", () => {
    expect(perWeek(-100)).toBeNull();
  });

  it("returns null for null input", () => {
    expect(perWeek(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(perWeek(undefined)).toBeNull();
  });
});

describe("perRoom", () => {
  it("returns rent divided by number of beds, rounded", () => {
    expect(perRoom(1800, 3)).toBe(600);
  });

  it("returns monthly rent as-is when beds is 1", () => {
    expect(perRoom(1500, 1)).toBe(1500);
  });

  it("returns null when beds is 0 (studio)", () => {
    expect(perRoom(1500, 0)).toBeNull();
  });

  it("returns null when beds is null", () => {
    expect(perRoom(1500, null)).toBeNull();
  });

  it("returns null when monthlyRent is null", () => {
    expect(perRoom(null, 2)).toBeNull();
  });

  it("returns null when monthlyRent is 0", () => {
    expect(perRoom(0, 2)).toBeNull();
  });

  it("rounds fractional result", () => {
    // 1000 / 3 = 333.33… → rounds to 333
    expect(perRoom(1000, 3)).toBe(333);
  });
});

describe("moveInCost", () => {
  it("computes totalUpfront = firstMonthRent + deposit + holdingDeposit", () => {
    const result = moveInCost({ monthlyRent: 1500, deposit: 1731, holdingDeposit: 346 });

    expect(result.firstMonthRent).toBe(1500);
    expect(result.deposit).toBe(1731);
    expect(result.holdingDeposit).toBe(346);
    expect(result.totalUpfront).toBe(3577);
  });

  it("treats undefined deposit as 0", () => {
    const result = moveInCost({ monthlyRent: 1200 });

    expect(result.deposit).toBe(0);
    expect(result.holdingDeposit).toBe(0);
    expect(result.totalUpfront).toBe(1200);
  });

  it("treats null deposit and holdingDeposit as 0", () => {
    const result = moveInCost({ monthlyRent: 1000, deposit: null, holdingDeposit: null });

    expect(result.deposit).toBe(0);
    expect(result.holdingDeposit).toBe(0);
    expect(result.totalUpfront).toBe(1000);
  });

  it("clamps negative monthlyRent to 0", () => {
    const result = moveInCost({ monthlyRent: -500, deposit: 1000, holdingDeposit: 200 });

    expect(result.firstMonthRent).toBe(0);
    expect(result.totalUpfront).toBe(1200);
  });

  it("clamps negative deposit to 0", () => {
    const result = moveInCost({ monthlyRent: 1000, deposit: -200, holdingDeposit: 100 });

    expect(result.deposit).toBe(0);
    expect(result.totalUpfront).toBe(1100);
  });

  it("rounds fractional monthly rent", () => {
    const result = moveInCost({ monthlyRent: 1499.7 });

    expect(result.firstMonthRent).toBe(1500);
  });
});

describe("incomeNeededAnnual", () => {
  it("returns 30x monthly rent", () => {
    expect(incomeNeededAnnual(1500)).toBe(45000);
  });

  it("returns 0 for zero monthly rent", () => {
    expect(incomeNeededAnnual(0)).toBe(0);
  });

  it("returns 0 for negative monthly rent", () => {
    expect(incomeNeededAnnual(-200)).toBe(0);
  });

  it("returns 0 for null", () => {
    expect(incomeNeededAnnual(null)).toBe(0);
  });

  it("returns 0 for undefined", () => {
    expect(incomeNeededAnnual(undefined)).toBe(0);
  });
});

describe("incomeNeededMonthly", () => {
  it("returns annual income needed divided by 12", () => {
    // incomeNeededAnnual(1500) = 45000; 45000 / 12 = 3750
    expect(incomeNeededMonthly(1500)).toBe(3750);
  });

  it("returns 0 for zero monthly rent", () => {
    expect(incomeNeededMonthly(0)).toBe(0);
  });

  it("returns 0 for null", () => {
    expect(incomeNeededMonthly(null)).toBe(0);
  });
});

describe("depositCap", () => {
  it("reports exceeds false when deposit is within the 5-week cap", () => {
    // monthlyRent 1250 → weekly ≈288.46 → cap = round(5 * 288.46) = 1442
    const result = depositCap(1250, 1400);

    expect(result.capWeeks).toBe(5);
    expect(result.capAmount).toBe(1442);
    expect(result.exceeds).toBe(false);
  });

  it("reports exceeds true when deposit is over the 5-week cap", () => {
    const result = depositCap(1250, 1800);

    expect(result.capWeeks).toBe(5);
    expect(result.capAmount).toBe(1442);
    expect(result.exceeds).toBe(true);
  });

  it("uses 6-week cap when annual rent >= £50,000", () => {
    // monthlyRent 4167 → annual 50004 → 6-week cap
    const result = depositCap(4167);

    expect(result.capWeeks).toBe(6);
  });

  it("uses 5-week cap when annual rent is exactly below £50,000 threshold", () => {
    // monthlyRent 4166 → annual 49992 → 5-week cap
    const result = depositCap(4166);

    expect(result.capWeeks).toBe(5);
  });

  it("reports exceeds false when deposit is null", () => {
    const result = depositCap(1250, null);

    expect(result.exceeds).toBe(false);
  });

  it("reports exceeds false when deposit is undefined", () => {
    const result = depositCap(1250);

    expect(result.exceeds).toBe(false);
  });

  it("returns capAmount 0 and exceeds false for null monthlyRent", () => {
    const result = depositCap(null, 500);

    expect(result.capAmount).toBe(0);
    expect(result.exceeds).toBe(false);
  });
});
