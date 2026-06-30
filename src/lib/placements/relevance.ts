/**
 * relevance.ts
 *
 * Maps a property's listing type / buyer journey stage to the categories of
 * local professional that are genuinely relevant at that moment. This is what
 * makes "Featured Local Experts" feel like a recommendation system rather than
 * untargeted advertising: a renter sees removals & cleaners, a buyer sees
 * mortgage brokers & conveyancers, a renovator sees architects & builders.
 *
 * Categories are constrained to the existing `service_category` enum so they
 * map directly onto trader profiles (`service_provider_details.services`).
 */

import type { ServiceCategory } from "@/types/marketplace";

export type PlacementStage = "buy" | "rent" | "renovation";

/** Property listing types as stored on `listings.listing_type`. */
export type ListingType = "sale" | "rent";

const STAGE_CATEGORIES: Record<PlacementStage, readonly ServiceCategory[]> = {
  // High-intent purchase journey: finance, legal, due diligence, the move.
  buy: ["mortgage_broker", "conveyancing", "surveying", "home_inspector", "moving_company"],
  // Move-in journey: getting into and settling a rented home.
  rent: ["moving_company", "cleaning", "handyman", "interior_design", "property_management"],
  // Renovation / extension potential: trades who do the work.
  renovation: ["architect", "builder", "electrician", "plumber", "plasterer", "carpenter", "painter", "landscaping"],
};

/**
 * Returns the placement stages relevant to a listing. Sale listings carry both
 * the buying journey and (because TrueDeed surfaces renovation/PD potential) a
 * renovation stage. Rental listings carry only the move-in journey.
 */
export function stagesForListing(listingType: ListingType): PlacementStage[] {
  return listingType === "rent" ? ["rent"] : ["buy", "renovation"];
}

/** Categories of professional relevant to a given journey stage. */
export function categoriesForStage(stage: PlacementStage): ServiceCategory[] {
  return [...STAGE_CATEGORIES[stage]];
}

/** All categories relevant to a listing across its stages, de-duplicated. */
export function categoriesForListing(listingType: ListingType): ServiceCategory[] {
  const seen = new Set<ServiceCategory>();
  for (const stage of stagesForListing(listingType)) {
    for (const cat of STAGE_CATEGORIES[stage]) seen.add(cat);
  }
  return [...seen];
}
