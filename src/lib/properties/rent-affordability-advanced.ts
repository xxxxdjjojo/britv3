/**
 * Rent affordability calculator — advanced (3-mode) pure logic.
 *
 * Ported from a reference implementation into TrueDeed. Three modes share one
 * income model:
 *  1. Affordability — how much rent can I comfortably afford?
 *  2. Required income — what income do I need for a target rent?
 *  3. Roommate split — what is my share of a shared tenancy?
 *
 * These functions are pure, deterministic, and colour-agnostic (the UI maps
 * risk-band ids to brand colours). This is a guidance tool, NOT a guarantee of
 * landlord or referencing approval.
 *
 * Notes on fidelity to the reference:
 *  - Net income is estimated at ~78% of gross (a rough UK after-tax proxy).
 *  - The reference double-counted utilities in its outgoings/needs figures
 *    (utilities live inside `expenses`, yet were added again). That is corrected
 *    here: utilities are counted once, inside `totalExpenses`.
 */

const NET_FROM_GROSS = 0.78;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));
const nonNeg = (value: number): number => Math.max(0, value);

// ─── Income ──────────────────────────────────────────────────────

export type IncomeInput = Readonly<{
  /** Annual gross income before tax */
  annualGrossIncome: number;
  /** Optional exact monthly take-home; 0 = auto-estimate from gross */
  monthlyNetIncome: number;
  /** Optional partner/household annual gross income */
  partnerAnnualIncome: number;
}>;

export type IncomeDerived = Readonly<{
  monthlyGross: number;
  monthlyNet: number;
  totalMonthlyIncome: number;
  totalMonthlyNet: number;
}>;

export function computeIncome(input: IncomeInput): IncomeDerived {
  const annualGross = nonNeg(input.annualGrossIncome);
  const partner = nonNeg(input.partnerAnnualIncome);
  const enteredNet = nonNeg(input.monthlyNetIncome);

  const monthlyGross = annualGross / 12;
  const monthlyNet = enteredNet || monthlyGross * NET_FROM_GROSS;
  const partnerMonthlyGross = partner / 12;

  return {
    monthlyGross,
    monthlyNet,
    totalMonthlyIncome: monthlyGross + partnerMonthlyGross,
    totalMonthlyNet: monthlyNet + partnerMonthlyGross * NET_FROM_GROSS,
  };
}

// ─── Risk bands ──────────────────────────────────────────────────

export const RISK_BANDS = [
  { id: "excellent", maxRatio: 20, label: "Excellent" },
  { id: "good", maxRatio: 25, label: "Good" },
  { id: "fair", maxRatio: 30, label: "Fair" },
  { id: "stretched", maxRatio: 35, label: "Stretched" },
  { id: "risky", maxRatio: Infinity, label: "Risky" },
] as const;

export type RiskBandId = (typeof RISK_BANDS)[number]["id"];

export type RiskBand = Readonly<{ id: RiskBandId; label: string }>;

export function getRiskBand(ratio: number): RiskBand {
  const band = RISK_BANDS.find((b) => ratio <= b.maxRatio) ?? RISK_BANDS[RISK_BANDS.length - 1];
  return { id: band.id, label: band.label };
}

// ─── Mode 1: Affordability ───────────────────────────────────────

export type DebtsInput = Readonly<{
  studentLoans: number;
  carPayment: number;
  creditCards: number;
  personalLoans: number;
  otherDebts: number;
}>;

export type ExpensesInput = Readonly<{
  utilities: number;
  groceries: number;
  transport: number;
  insurance: number;
  subscriptions: number;
  internet: number;
  phone: number;
  other: number;
}>;

export type MoveInInput = Readonly<{
  securityDeposit: number;
  adminFee: number;
  firstMonthUpfront: boolean;
  lastMonthUpfront: boolean;
  movingCosts: number;
  emergencyCushion: number;
}>;

export type AffordabilityInput = Readonly<{
  income: IncomeInput;
  /** Rent-to-income ratio cap, as a percentage (e.g. 30) */
  rentToIncomeRatio: number;
  /** Savings goal as a percentage of net income */
  savingsGoal: number;
  /** Rent being evaluated for the gauge/breakdown; 0 = use the suggested max */
  currentRent: number;
  debts: DebtsInput;
  expenses: ExpensesInput;
  moveIn: MoveInInput;
}>;

export type BudgetSlice = Readonly<{ key: string; label: string; value: number }>;

export type AffordabilityResult = Readonly<{
  monthlyGross: number;
  monthlyNet: number;
  totalMonthlyIncome: number;
  totalMonthlyNet: number;
  totalDebts: number;
  totalExpenses: number;
  savingsAmount: number;
  maxRentByRatio: number;
  affordableRent: number;
  suggestedRent: number;
  evaluatedRent: number;
  currentRatio: number;
  riskBand: RiskBand;
  monthlyHousingCost: number;
  totalMonthlyOutgoings: number;
  moneyLeftover: number;
  yearlyRent: number;
  yearlyHousingCost: number;
  yearlyOutgoings: number;
  needsPercent: number;
  wantsPercent: number;
  savingsPercent: number;
  budgetSlices: readonly BudgetSlice[];
  moveInTotal: number;
}>;

const sumValues = (record: Readonly<Record<string, number>>): number =>
  Object.values(record).reduce((total, v) => total + nonNeg(v), 0);

export function computeAffordability(input: AffordabilityInput): AffordabilityResult {
  const { monthlyGross, monthlyNet, totalMonthlyIncome, totalMonthlyNet } = computeIncome(
    input.income,
  );

  const totalDebts = sumValues(input.debts);
  const totalExpenses = sumValues(input.expenses);
  const utilities = nonNeg(input.expenses.utilities);

  const savingsGoal = clamp(input.savingsGoal, 0, 100);
  const savingsAmount = (savingsGoal / 100) * totalMonthlyNet;

  const ratio = clamp(input.rentToIncomeRatio, 0, 100);
  const maxRentByRatio = (ratio / 100) * totalMonthlyIncome;
  const affordableRent = nonNeg(totalMonthlyNet - totalDebts - totalExpenses - savingsAmount);
  const suggestedRent = nonNeg(Math.min(maxRentByRatio, affordableRent));

  const evaluatedRent = input.currentRent > 0 ? nonNeg(input.currentRent) : suggestedRent;

  // Utilities are counted once (they live inside totalExpenses).
  const monthlyHousingCost = evaluatedRent + utilities; // display only
  const totalMonthlyOutgoings = evaluatedRent + totalExpenses + totalDebts;
  const moneyLeftover = totalMonthlyNet - totalMonthlyOutgoings - savingsAmount;

  const currentRatio = totalMonthlyIncome > 0 ? (evaluatedRent / totalMonthlyIncome) * 100 : 0;

  // 50/30/20 framework
  const needsTotal = evaluatedRent + totalExpenses + totalDebts;
  const needsPercent = totalMonthlyNet > 0 ? (needsTotal / totalMonthlyNet) * 100 : 0;
  const wantsPercent =
    totalMonthlyNet > 0 ? Math.max(0, 30 - (needsPercent > 50 ? needsPercent - 50 : 0)) : 0;
  const savingsPercent = Math.max(0, 100 - needsPercent - wantsPercent);

  const moveInTotal =
    nonNeg(input.moveIn.securityDeposit) +
    nonNeg(input.moveIn.adminFee) +
    (input.moveIn.firstMonthUpfront ? evaluatedRent : 0) +
    (input.moveIn.lastMonthUpfront ? evaluatedRent : 0) +
    nonNeg(input.moveIn.movingCosts) +
    nonNeg(input.moveIn.emergencyCushion);

  const budgetSlices: BudgetSlice[] = [
    { key: "rent", label: "Rent", value: nonNeg(evaluatedRent) },
    { key: "utilities", label: "Utilities", value: nonNeg(utilities) },
    { key: "debts", label: "Debts", value: nonNeg(totalDebts) },
    { key: "expenses", label: "Other expenses", value: nonNeg(totalExpenses - utilities) },
    { key: "savings", label: "Savings", value: nonNeg(savingsAmount) },
    { key: "leftover", label: "Leftover", value: nonNeg(moneyLeftover) },
  ];

  return {
    monthlyGross,
    monthlyNet,
    totalMonthlyIncome,
    totalMonthlyNet,
    totalDebts,
    totalExpenses,
    savingsAmount,
    maxRentByRatio,
    affordableRent,
    suggestedRent,
    evaluatedRent,
    currentRatio,
    riskBand: getRiskBand(currentRatio),
    monthlyHousingCost,
    totalMonthlyOutgoings,
    moneyLeftover,
    yearlyRent: evaluatedRent * 12,
    yearlyHousingCost: monthlyHousingCost * 12,
    yearlyOutgoings: totalMonthlyOutgoings * 12,
    needsPercent,
    wantsPercent,
    savingsPercent,
    budgetSlices,
    moveInTotal,
  };
}

// ─── Mode 2: Required income ─────────────────────────────────────

export type RequiredIncomeInput = Readonly<{
  targetRent: number;
  rentToIncomeRatio: number;
}>;

export type RequiredIncomeResult = Readonly<{
  requiredAnnualGross: number;
  requiredMonthlyGross: number;
  estMonthlyNet: number;
}>;

export function computeRequiredIncome(input: RequiredIncomeInput): RequiredIncomeResult {
  const rent = nonNeg(input.targetRent);
  const ratio = clamp(input.rentToIncomeRatio, 0, 100);

  if (ratio <= 0) {
    return { requiredAnnualGross: 0, requiredMonthlyGross: 0, estMonthlyNet: 0 };
  }

  const requiredAnnualGross = (rent * 12) / (ratio / 100);
  const requiredMonthlyGross = requiredAnnualGross / 12;
  return {
    requiredAnnualGross,
    requiredMonthlyGross,
    estMonthlyNet: requiredMonthlyGross * NET_FROM_GROSS,
  };
}

export const DEFAULT_RENT_ROWS = [500, 750, 1_000, 1_250, 1_500, 1_750, 2_000, 2_500, 3_000] as const;

export type RentReferenceRow = Readonly<{
  rent: number;
  at25: number;
  at30: number;
  at35: number;
}>;

export function buildRentReferenceTable(
  rents: readonly number[] = DEFAULT_RENT_ROWS,
): RentReferenceRow[] {
  return rents.map((rent) => ({
    rent,
    at25: (rent * 12) / 0.25,
    at30: (rent * 12) / 0.3,
    at35: (rent * 12) / 0.35,
  }));
}

// ─── Mode 3: Roommate split ──────────────────────────────────────

export type RoommateInput = Readonly<{
  totalRent: number;
  /** Number of roommates excluding you */
  numRoommates: number;
  splitMethod: "equal" | "unequal";
  /** Your share as a percentage (only used when splitMethod === "unequal") */
  yourSharePercent: number;
  includeUtilities: boolean;
  monthlyUtilities: number;
  /** Optional — used to flag affordability of your share */
  yourAnnualGrossIncome: number;
}>;

export type RoommatePerson = Readonly<{
  label: string;
  isYou: boolean;
  rentShare: number;
  utilities: number;
  total: number;
}>;

export type RoommateAffordabilityTone = "affordable" | "stretched" | "high";

export type RoommateResult = Readonly<{
  totalPeople: number;
  rentPerPersonEqual: number;
  yourRentShare: number;
  utilitiesPerPerson: number;
  yourTotalMonthly: number;
  roommateRatio: number;
  affordabilityTone: RoommateAffordabilityTone;
  breakdown: readonly RoommatePerson[];
  depositPerPerson: number;
  firstMonthPerPerson: number;
  yourTotalUpfront: number;
}>;

function roommateTone(ratio: number): RoommateAffordabilityTone {
  if (ratio <= 30) return "affordable";
  if (ratio <= 40) return "stretched";
  return "high";
}

export function computeRoommateSplit(input: RoommateInput): RoommateResult {
  const rent = nonNeg(input.totalRent);
  const roommates = Math.max(1, Math.floor(nonNeg(input.numRoommates)));
  const totalPeople = roommates + 1;
  const sharePercent = clamp(input.yourSharePercent, 0, 100);
  const utilities = nonNeg(input.monthlyUtilities);

  const rentPerPersonEqual = rent / totalPeople;
  const yourRentShare =
    input.splitMethod === "equal" ? rentPerPersonEqual : rent * (sharePercent / 100);

  const utilitiesPerPerson = input.includeUtilities ? utilities / totalPeople : 0;
  const yourTotalMonthly = yourRentShare + utilitiesPerPerson;

  const yourMonthlyGross = nonNeg(input.yourAnnualGrossIncome) / 12;
  const roommateRatio = yourMonthlyGross > 0 ? (yourTotalMonthly / yourMonthlyGross) * 100 : 0;

  const otherShare =
    totalPeople > 1 ? (rent * ((100 - sharePercent) / 100)) / (totalPeople - 1) : 0;

  const breakdown: RoommatePerson[] = Array.from({ length: totalPeople }, (_, i) => {
    const isYou = i === 0;
    const rentShare =
      input.splitMethod === "equal" ? rentPerPersonEqual : isYou ? yourRentShare : otherShare;
    const personUtilities = input.includeUtilities ? utilitiesPerPerson : 0;
    return {
      label: isYou ? "You" : `Roommate ${i}`,
      isYou,
      rentShare,
      utilities: personUtilities,
      total: rentShare + personUtilities,
    };
  });

  const depositPerPerson = rent / totalPeople;

  return {
    totalPeople,
    rentPerPersonEqual,
    yourRentShare,
    utilitiesPerPerson,
    yourTotalMonthly,
    roommateRatio,
    affordabilityTone: roommateTone(roommateRatio),
    breakdown,
    depositPerPerson,
    firstMonthPerPerson: yourRentShare,
    yourTotalUpfront: depositPerPerson + yourRentShare,
  };
}
