/**
 * pricing.ts
 *
 * Pure helpers for placement pricing and provider quality, used by both the
 * trader "Boost My Profile" dashboard (price + estimated reach) and the ranking
 * layer (profile completeness). No prices are hardcoded here — actual prices
 * live in the admin-managed `placement_products` table; these helpers only
 * transform configured values.
 */

export type PlacementType =
  | "town_boost"
  | "postcode_boost"
  | "property_detail_boost"
  | "category_leader";

export type LaunchDiscount = {
  launchDiscountPct: number; // 0–100
  launchDiscountMonths: number;
};

/**
 * Price (in pence) a provider pays in a given billing month, applying any launch
 * discount for the first N months. `monthIndex` is 0-based.
 */
export function applyLaunchDiscount(
  monthlyPricePence: number,
  { launchDiscountPct, launchDiscountMonths }: LaunchDiscount,
  monthIndex: number,
): number {
  if (launchDiscountPct <= 0 || monthIndex >= launchDiscountMonths) {
    return monthlyPricePence;
  }
  const pct = Math.min(100, Math.max(0, launchDiscountPct));
  return Math.round(monthlyPricePence * (1 - pct / 100));
}

// Share of an area's monthly property views a placement type can plausibly reach.
const TYPE_REACH_SHARE: Record<PlacementType, number> = {
  town_boost: 0.6,
  postcode_boost: 0.45,
  property_detail_boost: 0.35,
  category_leader: 0.5,
};

/**
 * Rough estimate of monthly impressions a placement will receive, used only to
 * set advertiser expectations in the dashboard. Fewer impressions when a slot is
 * shared by more advertisers.
 */
export function estimateMonthlyImpressions({
  placementType,
  monthlyAreaViews,
  slotLimit,
}: {
  placementType: PlacementType;
  monthlyAreaViews: number;
  slotLimit: number;
}): number {
  const share = TYPE_REACH_SHARE[placementType];
  const advertisers = Math.max(1, slotLimit);
  return Math.round((monthlyAreaViews * share) / advertisers);
}

const COMPLETENESS_FIELDS = 7;

/**
 * Fraction (0–1) of key profile fields a provider has filled in. Drives the
 * "profile completeness" ranking factor and the dashboard nudge to finish a
 * profile before boosting.
 */
export function computeProfileCompleteness(profile: {
  businessName: string | null;
  businessDescription: string | null;
  services: string[] | null;
  servicePostcodes: string[] | null;
  avatarUrl: string | null;
  qualifications: string[] | null;
  portfolioUrls: string[] | null;
}): number {
  let filled = 0;
  if (profile.businessName && profile.businessName.trim().length > 0) filled++;
  if (profile.businessDescription && profile.businessDescription.trim().length > 0) filled++;
  if (profile.services && profile.services.length > 0) filled++;
  if (profile.servicePostcodes && profile.servicePostcodes.length > 0) filled++;
  if (profile.avatarUrl) filled++;
  if (profile.qualifications && profile.qualifications.length > 0) filled++;
  if (profile.portfolioUrls && profile.portfolioUrls.length > 0) filled++;
  return filled / COMPLETENESS_FIELDS;
}
