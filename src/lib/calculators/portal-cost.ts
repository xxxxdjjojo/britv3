import { PORTAL_COST_ASSUMPTIONS } from "@/config/portal-cost-assumptions";

/**
 * Pure portal-cost estimator (Influence Strategy Phase 1, item 1.2).
 *
 * Deliberately honest and simple: the per-listing portal cost is just
 * ARPA ÷ listings-per-branch. Region does NOT vary the model (no sourced
 * regional portal-fee data exists) — it only labels the illustration; the
 * commission range varies with asking price alone. Every assumption used is
 * echoed back so the UI renders exactly what was computed with.
 */

export const UK_REGIONS = [
  { value: "london", label: "London" },
  { value: "south-east", label: "South East" },
  { value: "south-west", label: "South West" },
  { value: "east-of-england", label: "East of England" },
  { value: "midlands", label: "Midlands" },
  { value: "north-of-england", label: "North of England" },
  { value: "wales", label: "Wales" },
  { value: "scotland", label: "Scotland" },
  { value: "northern-ireland", label: "Northern Ireland" },
] as const;

export type Region = (typeof UK_REGIONS)[number]["value"];

export type PortalCostOverrides = Partial<{
  arpaMonthly: number;
  listingsPerBranchMonthly: number;
  commissionRateLow: number;
  commissionRateHigh: number;
}>;

export type PortalCostInput = {
  askingPrice: number;
  region: Region;
  agencySizeBranches?: number;
  overrides?: PortalCostOverrides;
};

export type PortalCostEstimate = {
  region: Region;
  askingPrice: number;
  agencySizeBranches: number;
  /** Estimated monthly portal spend for the agency (ARPA × branches). */
  monthlyPortalSpend: number;
  /** Estimated portal cost embedded in one transaction (ARPA ÷ listings/branch). */
  portalCostPerListing: number;
  /** Illustrative commission on the asking price at the low/high typical rate. */
  commissionLow: number;
  commissionHigh: number;
  /** Portal cost as a share of that commission, in percent (low ↔ high range). */
  shareOfCommissionLowPct: number;
  shareOfCommissionHighPct: number;
  /** The exact assumption values used, so the UI renders what was computed with. */
  assumptions: {
    arpaMonthly: number;
    listingsPerBranchMonthly: number;
    commissionRateLow: number;
    commissionRateHigh: number;
  };
};

function assertPositiveFinite(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive finite number, got ${value}`);
  }
}

export function buildPortalCostEstimate(input: PortalCostInput): PortalCostEstimate {
  const { askingPrice, region, overrides } = input;
  const agencySizeBranches = input.agencySizeBranches ?? 1;

  const arpaMonthly = overrides?.arpaMonthly ?? PORTAL_COST_ASSUMPTIONS.arpaMonthly.value;
  const listingsPerBranchMonthly =
    overrides?.listingsPerBranchMonthly ??
    PORTAL_COST_ASSUMPTIONS.listingsPerBranchMonthly.value;
  const commissionRateLow =
    overrides?.commissionRateLow ?? PORTAL_COST_ASSUMPTIONS.commissionRateLow.value;
  const commissionRateHigh =
    overrides?.commissionRateHigh ?? PORTAL_COST_ASSUMPTIONS.commissionRateHigh.value;

  assertPositiveFinite(askingPrice, "askingPrice");
  assertPositiveFinite(agencySizeBranches, "agencySizeBranches");
  assertPositiveFinite(arpaMonthly, "arpaMonthly");
  assertPositiveFinite(listingsPerBranchMonthly, "listingsPerBranchMonthly");
  assertPositiveFinite(commissionRateLow, "commissionRateLow");
  assertPositiveFinite(commissionRateHigh, "commissionRateHigh");
  if (commissionRateLow > commissionRateHigh) {
    throw new RangeError("commissionRateLow must not exceed commissionRateHigh");
  }

  const portalCostPerListing = arpaMonthly / listingsPerBranchMonthly;
  const commissionLow = askingPrice * commissionRateLow;
  const commissionHigh = askingPrice * commissionRateHigh;

  return {
    region,
    askingPrice,
    agencySizeBranches,
    monthlyPortalSpend: arpaMonthly * agencySizeBranches,
    portalCostPerListing,
    commissionLow,
    commissionHigh,
    // Low share = against the HIGH commission; high share = against the LOW.
    shareOfCommissionLowPct: (portalCostPerListing / commissionHigh) * 100,
    shareOfCommissionHighPct: (portalCostPerListing / commissionLow) * 100,
    assumptions: {
      arpaMonthly,
      listingsPerBranchMonthly,
      commissionRateLow,
      commissionRateHigh,
    },
  };
}
