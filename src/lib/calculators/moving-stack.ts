/**
 * Total Cost of Moving Stack (Influence Strategy Phase 1, item 1.6).
 *
 * Pure, itemised "brutal stack" of everything it costs to move house.
 *
 * LEGAL FRAMING (non-negotiable):
 * - No fabricated numbers. Every line item either carries a real, checkable
 *   source URL or is explicitly labelled an estimate/assumption via `note`.
 * - Tax is NEVER re-implemented here: `calculateSdlt` / `calculateLbtt` /
 *   `calculateLtt` are the single source of truth, so identical inputs produce
 *   figures identical to the stamp-duty calculator.
 * - The portal passthrough line reuses `buildPortalCostEstimate` and the
 *   sourced defaults in `@/config/portal-cost-assumptions` — it is always
 *   labelled an estimate.
 * - TrueDeed's own tiers are never re-hardcoded shorthand: callers map
 *   SELLER_PLANS (prices in pence, server-only billing config) to the
 *   serialisable `SellerPlanSummary` shape in a Server Component and pass it
 *   in — this module stays client-safe and pure.
 */

import type { BuyerType } from "@/types/calculators";
import { calculateSdlt } from "@/lib/calculators/sdlt";
import { calculateLbtt } from "@/lib/calculators/lbtt";
import { calculateLtt } from "@/lib/calculators/ltt";
import { buildPortalCostEstimate } from "@/lib/calculators/portal-cost";
import { PORTAL_COST_ASSUMPTIONS } from "@/config/portal-cost-assumptions";

export type MovingStackLocation = "england" | "ni" | "scotland" | "wales";

export type MovingStackInput = Readonly<{
  propertyPrice: number;
  location: MovingStackLocation;
  buyerType: BuyerType;
  selling: boolean;
  /** Optional override for the traditional agent commission (0..1 decimal). */
  agentCommissionRate?: number;
}>;

export type LineItemSource = Readonly<{ url: string; label: string }>;

export type MovingStackLineItem = Readonly<{
  key: string;
  label: string;
  low: number;
  high: number;
  kind: "tax" | "fee" | "range" | "estimate";
  source?: LineItemSource;
  note?: string;
}>;

export type MovingStackResult = Readonly<{
  items: ReadonlyArray<MovingStackLineItem>;
  totalLow: number;
  totalHigh: number;
}>;

/**
 * Serialisable summary of a seller plan, mapped from the server-only billing
 * config's SELLER_PLANS by a Server Component.
 */
export type SellerPlanSummary = Readonly<{
  id: string;
  name: string;
  /** Upfront fixed fee in pence (the billing config's priceMonthly). */
  priceMonthlyPence: number;
  /** Commission rate on completion (0..1 decimal; 0 when the plan has none). */
  commissionRate: number;
  commissionLabel?: string;
}>;

export type TrueDeedTierCost = Readonly<{
  id: string;
  name: string;
  /** Upfront fixed fee in GBP (converted from the plan summary's pence). */
  fixedFee: number;
  /** Commission rate on completion (0..1 decimal). */
  commissionRate: number;
  commissionLabel: string;
  /** Commission in GBP at the given price. */
  commissionAtPrice: number;
  /** fixedFee + commissionAtPrice, in GBP. */
  total: number;
}>;

export type TrueDeedComparison = Readonly<{
  tiers: ReadonlyArray<TrueDeedTierCost>;
  cheapestId: string;
}>;

// ---------------------------------------------------------------------------
// Sources — every URL below was checked live before shipping.
// ---------------------------------------------------------------------------

const TAX_SOURCES: Record<MovingStackLocation, LineItemSource> = {
  england: {
    url: "https://www.gov.uk/stamp-duty-land-tax/residential-property-rates",
    label: "GOV.UK — SDLT residential rates",
  },
  ni: {
    url: "https://www.gov.uk/stamp-duty-land-tax/residential-property-rates",
    label: "GOV.UK — SDLT residential rates",
  },
  scotland: {
    url: "https://revenue.scot/taxes/land-buildings-transaction-tax",
    label: "Revenue Scotland — LBTT",
  },
  wales: {
    url: "https://www.gov.wales/land-transaction-tax-rates-and-bands",
    label: "GOV.WALES — LTT rates and bands",
  },
};

const CONVEYANCING_SOURCE: LineItemSource = {
  url: "https://hoa.org.uk/advice/guides-for-homeowners/i-am-buying/much-conveyancing-fees-cost/",
  label: "HomeOwners Alliance — conveyancing fees guide",
};

const SURVEY_SOURCE: LineItemSource = {
  url: "https://hoa.org.uk/advice/guides-for-homeowners/i-am-buying/how-much-does-a-house-survey-cost/",
  label: "HomeOwners Alliance — house survey cost guide",
};

const REMOVALS_SOURCE: LineItemSource = {
  url: "https://hoa.org.uk/advice/guides-for-homeowners/i-am-buying/how-much-do-removals-cost/",
  label: "HomeOwners Alliance — removals cost guide",
};

const EPC_SOURCE: LineItemSource = {
  url: "https://www.gov.uk/buy-sell-your-home/energy-performance-certificates",
  label: "GOV.UK — Energy Performance Certificates",
};

// Typical published ranges (GBP). Each is cited next to where it is used.
const CONVEYANCING_RANGE = { low: 1200, high: 1800 } as const;
const SURVEY_RANGE = { low: 300, high: 700 } as const;
const REMOVALS_RANGE = { low: 500, high: 1500 } as const;
const EPC_RANGE = { low: 60, high: 120 } as const;

const TAX_LABELS: Record<MovingStackLocation, string> = {
  england: "Stamp Duty Land Tax (SDLT)",
  ni: "Stamp Duty Land Tax (SDLT)",
  scotland: "Land and Buildings Transaction Tax (LBTT)",
  wales: "Land Transaction Tax (LTT)",
};

// ---------------------------------------------------------------------------
// Tax — delegates to the exact calculators used by the stamp-duty page.
// ---------------------------------------------------------------------------

function taxForLocation(
  price: number,
  location: MovingStackLocation,
  buyerType: BuyerType,
): { amount: number; note?: string } {
  switch (location) {
    case "scotland":
      return {
        amount: calculateLbtt(price, buyerType === "first_time").totalTax,
        note:
          buyerType === "additional"
            ? "Scotland's Additional Dwelling Supplement is not modelled — standard LBTT rates shown."
            : undefined,
      };
    case "wales":
      return {
        amount: calculateLtt(price).totalTax,
        note:
          buyerType === "standard"
            ? undefined
            : "Wales has no first-time buyer relief; LTT higher rates for additional properties are not modelled.",
      };
    case "england":
    case "ni":
    default:
      return { amount: calculateSdlt(price, buyerType).totalTax };
  }
}

function assertValidInput(input: MovingStackInput): void {
  if (!Number.isFinite(input.propertyPrice) || input.propertyPrice <= 0) {
    throw new RangeError(
      `propertyPrice must be a positive finite number, got ${input.propertyPrice}`,
    );
  }
  const rate = input.agentCommissionRate;
  if (rate !== undefined && (!Number.isFinite(rate) || rate <= 0 || rate >= 1)) {
    throw new RangeError(
      `agentCommissionRate must be a decimal between 0 and 1, got ${rate}`,
    );
  }
}

// ---------------------------------------------------------------------------
// The stack
// ---------------------------------------------------------------------------

export function buildMovingStack(input: MovingStackInput): MovingStackResult {
  assertValidInput(input);
  const { propertyPrice, location, buyerType, selling, agentCommissionRate } = input;

  const tax = taxForLocation(propertyPrice, location, buyerType);

  const items: MovingStackLineItem[] = [
    {
      key: "stamp_duty",
      label: TAX_LABELS[location],
      low: tax.amount,
      high: tax.amount,
      kind: "tax",
      source: TAX_SOURCES[location],
      note: tax.note,
    },
    {
      key: "conveyancing",
      label: "Conveyancing / solicitor",
      low: CONVEYANCING_RANGE.low,
      high: CONVEYANCING_RANGE.high,
      kind: "range",
      source: CONVEYANCING_SOURCE,
      note: "Typical published range, not a quote — always get itemised quotes including disbursements.",
    },
    {
      key: "survey",
      label: "Survey / valuation",
      low: SURVEY_RANGE.low,
      high: SURVEY_RANGE.high,
      kind: "range",
      source: SURVEY_SOURCE,
      note: "Level 2 HomeBuyer to Level 3 Building Survey — varies with property size and age.",
    },
    {
      key: "removals",
      label: "Removals",
      low: REMOVALS_RANGE.low,
      high: REMOVALS_RANGE.high,
      kind: "range",
      source: REMOVALS_SOURCE,
      note: "Typical published range for a local household move — distance and volume move it.",
    },
  ];

  if (selling) {
    items.push({
      key: "epc",
      label: "EPC certificate (selling)",
      low: EPC_RANGE.low,
      high: EPC_RANGE.high,
      kind: "range",
      source: EPC_SOURCE,
      note: "Legally required to market your sale unless a valid EPC already exists.",
    });

    const rateLow =
      agentCommissionRate ?? PORTAL_COST_ASSUMPTIONS.commissionRateLow.value;
    const rateHigh =
      agentCommissionRate ?? PORTAL_COST_ASSUMPTIONS.commissionRateHigh.value;
    items.push({
      key: "agent_commission",
      label: "Traditional estate agent commission (selling)",
      low: propertyPrice * rateLow,
      high: propertyPrice * rateHigh,
      kind: agentCommissionRate === undefined ? "range" : "fee",
      source: PORTAL_COST_ASSUMPTIONS.commissionRateLow.source,
      note:
        agentCommissionRate === undefined
          ? "Typical sole-agency fee range of 1.2%–1.8% inc VAT applied to your price."
          : `Your rate: ${(agentCommissionRate * 100).toFixed(2)}% of the sale price.`,
    });

    // Region only labels the portal illustration — it never changes the maths
    // (see buildPortalCostEstimate). Defaults are the sourced assumptions.
    const portal = buildPortalCostEstimate({
      askingPrice: propertyPrice,
      region: "london",
    });
    items.push({
      key: "portal_passthrough",
      label: "Portal cost embedded in your listing (selling)",
      low: portal.portalCostPerListing,
      high: portal.portalCostPerListing,
      kind: "estimate",
      source: PORTAL_COST_ASSUMPTIONS.arpaMonthly.source,
      note: "Estimate: published portal ARPA ÷ an assumed listings-per-branch figure. Edit the assumptions on /tools/portal-cost-calculator.",
    });
  }

  const totalLow = items.reduce((sum, item) => sum + item.low, 0);
  const totalHigh = items.reduce((sum, item) => sum + item.high, 0);

  return { items, totalLow, totalHigh };
}

// ---------------------------------------------------------------------------
// TrueDeed comparison — real tiers, mapped from the billing config by the caller.
// ---------------------------------------------------------------------------

function tierCost(plan: SellerPlanSummary, price: number): TrueDeedTierCost {
  const fixedFee = plan.priceMonthlyPence / 100; // pence → GBP
  const commissionAtPrice = price * plan.commissionRate;
  return {
    id: plan.id,
    name: plan.name,
    fixedFee,
    commissionRate: plan.commissionRate,
    commissionLabel: plan.commissionLabel ?? "No commission",
    commissionAtPrice,
    total: fixedFee + commissionAtPrice,
  };
}

export function buildTrueDeedComparison(
  price: number,
  plans: ReadonlyArray<SellerPlanSummary>,
): TrueDeedComparison {
  if (!Number.isFinite(price) || price <= 0) {
    throw new RangeError(`price must be a positive finite number, got ${price}`);
  }
  if (plans.length === 0) {
    throw new RangeError("plans must contain at least one seller plan");
  }
  const tiers = plans.map((plan) => tierCost(plan, price));
  const cheapest = tiers.reduce((best, tier) =>
    tier.total < best.total ? tier : best,
  );
  return { tiers, cheapestId: cheapest.id };
}
