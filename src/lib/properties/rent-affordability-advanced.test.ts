import { describe, it, expect } from "vitest";
import {
  computeIncome,
  computeAffordability,
  computeRequiredIncome,
  computeRoommateSplit,
  buildRentReferenceTable,
  getRiskBand,
  type AffordabilityInput,
  type RoommateInput,
} from "./rent-affordability-advanced";

const emptyDebts = {
  studentLoans: 0,
  carPayment: 0,
  creditCards: 0,
  personalLoans: 0,
  otherDebts: 0,
};

const emptyExpenses = {
  utilities: 0,
  groceries: 0,
  transport: 0,
  insurance: 0,
  subscriptions: 0,
  internet: 0,
  phone: 0,
  other: 0,
};

const emptyMoveIn = {
  securityDeposit: 0,
  adminFee: 0,
  firstMonthUpfront: false,
  lastMonthUpfront: false,
  movingCosts: 0,
  emergencyCushion: 0,
};

function affordInput(overrides: Partial<AffordabilityInput> = {}): AffordabilityInput {
  return {
    income: { annualGrossIncome: 48_000, monthlyNetIncome: 0, partnerAnnualIncome: 0 },
    rentToIncomeRatio: 30,
    savingsGoal: 0,
    currentRent: 0,
    debts: emptyDebts,
    expenses: emptyExpenses,
    moveIn: emptyMoveIn,
    ...overrides,
  };
}

function roommateInput(overrides: Partial<RoommateInput> = {}): RoommateInput {
  return {
    totalRent: 1_800,
    numRoommates: 2,
    splitMethod: "equal",
    yourSharePercent: 50,
    includeUtilities: false,
    monthlyUtilities: 0,
    yourAnnualGrossIncome: 36_000,
    ...overrides,
  };
}

describe("computeIncome", () => {
  it("auto-estimates net at 78% of gross when net is blank", () => {
    const r = computeIncome({ annualGrossIncome: 60_000, monthlyNetIncome: 0, partnerAnnualIncome: 0 });
    expect(r.monthlyGross).toBe(5_000);
    expect(r.monthlyNet).toBe(3_900);
    expect(r.totalMonthlyIncome).toBe(5_000);
    expect(r.totalMonthlyNet).toBe(3_900);
  });

  it("uses entered net when provided (overrides the estimate)", () => {
    const r = computeIncome({ annualGrossIncome: 60_000, monthlyNetIncome: 3_000, partnerAnnualIncome: 0 });
    expect(r.monthlyNet).toBe(3_000);
  });

  it("folds partner income into household totals at the same tax rate", () => {
    const r = computeIncome({ annualGrossIncome: 60_000, monthlyNetIncome: 0, partnerAnnualIncome: 24_000 });
    expect(r.totalMonthlyIncome).toBe(7_000);
    expect(r.totalMonthlyNet).toBeCloseTo(5_460, 2);
  });

  it("returns zeros for blank income (no NaN)", () => {
    const r = computeIncome({ annualGrossIncome: 0, monthlyNetIncome: 0, partnerAnnualIncome: 0 });
    expect(r.monthlyGross).toBe(0);
    expect(r.monthlyNet).toBe(0);
    expect(Number.isNaN(r.totalMonthlyNet)).toBe(false);
  });

  it("clamps negative inputs to zero", () => {
    const r = computeIncome({ annualGrossIncome: -1000, monthlyNetIncome: -50, partnerAnnualIncome: -10 });
    expect(r.monthlyGross).toBe(0);
    expect(r.monthlyNet).toBe(0);
    expect(r.totalMonthlyIncome).toBe(0);
  });
});

describe("computeAffordability", () => {
  it("caps suggested rent by the rent-to-income ratio when income is high relative to expenses", () => {
    const r = computeAffordability(affordInput()); // gross 4000/mo, net 3120, 30% rule
    expect(r.maxRentByRatio).toBe(1_200);
    expect(r.affordableRent).toBe(3_120);
    expect(r.suggestedRent).toBe(1_200);
  });

  it("caps suggested rent by remaining cash when expenses are high", () => {
    const r = computeAffordability(
      affordInput({
        income: { annualGrossIncome: 120_000, monthlyNetIncome: 0, partnerAnnualIncome: 0 }, // net 7800
        rentToIncomeRatio: 40, // maxRentByRatio 4000
        savingsGoal: 10, // 780
        debts: { ...emptyDebts, personalLoans: 1_000 },
        expenses: { ...emptyExpenses, groceries: 5_000 },
      }),
    );
    expect(r.maxRentByRatio).toBe(4_000);
    expect(r.affordableRent).toBe(1_020); // 7800 - 1000 - 5000 - 780
    expect(r.suggestedRent).toBe(1_020);
  });

  it("computes savings amount as a percentage of net", () => {
    const r = computeAffordability(affordInput({ savingsGoal: 20 })); // net 3120
    expect(r.savingsAmount).toBeCloseTo(624, 2);
  });

  it("evaluates the gauge/breakdown against the suggested rent when no current rent is given", () => {
    const r = computeAffordability(affordInput());
    expect(r.evaluatedRent).toBe(1_200);
    expect(r.currentRatio).toBeCloseTo(30, 2); // 1200 / 4000
    expect(r.riskBand.id).toBe("fair");
  });

  it("evaluates against an explicit current rent when provided", () => {
    const r = computeAffordability(affordInput({ currentRent: 800 }));
    expect(r.evaluatedRent).toBe(800);
    expect(r.currentRatio).toBeCloseTo(20, 2);
    expect(r.riskBand.id).toBe("excellent");
  });

  it("applies the 50/30/20 framework and never returns negative percentages", () => {
    const r = computeAffordability(
      affordInput({
        income: { annualGrossIncome: 24_000, monthlyNetIncome: 2_000, partnerAnnualIncome: 0 },
        currentRent: 1_000,
        debts: { ...emptyDebts, creditCards: 100 },
        expenses: { ...emptyExpenses, groceries: 100 },
      }),
    );
    // needs = rent 1000 + expenses 100 + debts 100 = 1200 of net 2000 => 60%
    expect(r.needsPercent).toBeCloseTo(60, 2);
    expect(r.wantsPercent).toBeCloseTo(20, 2); // 30 - (60-50)
    expect(r.savingsPercent).toBeCloseTo(20, 2);
    expect(r.savingsPercent).toBeGreaterThanOrEqual(0);
  });

  it("does not double-count utilities in monthly outgoings", () => {
    const r = computeAffordability(
      affordInput({
        income: { annualGrossIncome: 0, monthlyNetIncome: 3_000, partnerAnnualIncome: 0 },
        currentRent: 1_000,
        expenses: { ...emptyExpenses, utilities: 200, groceries: 300 },
      }),
    );
    // outgoings = rent 1000 + totalExpenses 500 + debts 0 = 1500 (utilities counted once, inside expenses)
    expect(r.totalMonthlyOutgoings).toBe(1_500);
    expect(r.monthlyHousingCost).toBe(1_200); // rent + utilities, display only
  });

  it("produces non-negative budget slices and yearly projections", () => {
    const r = computeAffordability(affordInput({ currentRent: 1_000, savingsGoal: 100 }));
    for (const slice of r.budgetSlices) {
      expect(slice.value).toBeGreaterThanOrEqual(0);
    }
    expect(r.yearlyRent).toBe(12_000);
  });

  it("returns safe zeros when income is zero (no NaN/Infinity)", () => {
    const r = computeAffordability(
      affordInput({ income: { annualGrossIncome: 0, monthlyNetIncome: 0, partnerAnnualIncome: 0 } }),
    );
    expect(r.suggestedRent).toBe(0);
    expect(r.currentRatio).toBe(0);
    expect(Number.isFinite(r.needsPercent)).toBe(true);
  });
});

describe("getRiskBand", () => {
  it.each([
    [20, "excellent"],
    [25, "good"],
    [30, "fair"],
    [35, "stretched"],
    [36, "risky"],
  ])("maps ratio %i%% to band %s", (ratio, id) => {
    expect(getRiskBand(ratio).id).toBe(id);
  });
});

describe("computeRequiredIncome", () => {
  it("derives the gross income needed for a target rent at a given ratio", () => {
    const r = computeRequiredIncome({ targetRent: 1_500, rentToIncomeRatio: 30 });
    expect(r.requiredAnnualGross).toBe(60_000);
    expect(r.requiredMonthlyGross).toBe(5_000);
    expect(r.estMonthlyNet).toBe(3_900);
  });

  it("guards against a zero ratio (no Infinity)", () => {
    const r = computeRequiredIncome({ targetRent: 1_500, rentToIncomeRatio: 0 });
    expect(r.requiredAnnualGross).toBe(0);
    expect(Number.isFinite(r.requiredAnnualGross)).toBe(true);
  });
});

describe("buildRentReferenceTable", () => {
  it("builds 25/30/35 columns for each rent row", () => {
    const rows = buildRentReferenceTable([1_000]);
    expect(rows[0].rent).toBe(1_000);
    expect(rows[0].at25).toBe(48_000);
    expect(rows[0].at30).toBe(40_000);
    expect(rows[0].at35).toBeCloseTo(34_285.71, 1);
  });

  it("uses sensible default rows when none provided", () => {
    const rows = buildRentReferenceTable();
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]).toHaveProperty("at30");
  });
});

describe("computeRoommateSplit", () => {
  it("splits rent equally across all people including you", () => {
    const r = computeRoommateSplit(roommateInput()); // 1800 / 3 people
    expect(r.totalPeople).toBe(3);
    expect(r.rentPerPersonEqual).toBe(600);
    expect(r.yourRentShare).toBe(600);
  });

  it("applies a custom percentage share", () => {
    const r = computeRoommateSplit(
      roommateInput({ numRoommates: 1, splitMethod: "unequal", yourSharePercent: 40 }),
    );
    expect(r.yourRentShare).toBe(720); // 1800 * 40%
    const you = r.breakdown.find((p) => p.isYou);
    const other = r.breakdown.find((p) => !p.isYou);
    expect(you?.rentShare).toBe(720);
    expect(other?.rentShare).toBe(1_080); // remaining 60%
  });

  it("includes utilities per person when requested", () => {
    const r = computeRoommateSplit(roommateInput({ includeUtilities: true, monthlyUtilities: 150 }));
    expect(r.utilitiesPerPerson).toBe(50); // 150 / 3
    expect(r.yourTotalMonthly).toBe(650); // 600 + 50
  });

  it("excludes utilities when not requested", () => {
    const r = computeRoommateSplit(roommateInput({ includeUtilities: false, monthlyUtilities: 150 }));
    expect(r.utilitiesPerPerson).toBe(0);
    expect(r.yourTotalMonthly).toBe(600);
  });

  it("flags affordability against your income", () => {
    const r = computeRoommateSplit(roommateInput()); // 600 of 3000/mo gross = 20%
    expect(r.roommateRatio).toBeCloseTo(20, 2);
    expect(r.affordabilityTone).toBe("affordable");
  });

  it("clamps roommate count to at least one (no divide-by-zero)", () => {
    const r = computeRoommateSplit(roommateInput({ numRoommates: 0 }));
    expect(r.totalPeople).toBe(2);
    expect(Number.isFinite(r.rentPerPersonEqual)).toBe(true);
  });

  it("computes per-person move-in (deposit + first month)", () => {
    const r = computeRoommateSplit(roommateInput()); // 1800 / 3
    expect(r.depositPerPerson).toBe(600);
    expect(r.firstMonthPerPerson).toBe(600);
    expect(r.yourTotalUpfront).toBe(1_200);
  });
});
