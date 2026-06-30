/**
 * local-experts-service.ts
 *
 * Surfacing layer for the property page's "Local experts who can help with this
 * property" section. Blends ORGANIC verified, location-matched traders (from the
 * `local_experts_for_property` RPC) with a small, capped number of SPONSORED
 * placements (from `getFeaturedExperts`). Organic traders always appear when any
 * exist, so the section is populated by trust even with zero paid placements.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { getFeaturedExperts } from "@/services/placements/placement-service";
import {
  blendLocalExperts,
  categoryPriority,
} from "@/lib/placements/local-experts";
import type { ListingType } from "@/lib/placements/relevance";
import type { LocalExpert, LocalExpertRow } from "@/types/local-experts";

export type LocalExpertsQuery = {
  postcode?: string | null;
  postcodeDistrict?: string | null;
  lat?: number | null;
  lng?: number | null;
  town?: string | null;
  region?: string | null;
  listingType: ListingType;
  hasRenovationPotential: boolean;
  /** Total cards to display. */
  limit?: number;
  /** Max sponsored cards (kept calm — 1–2). */
  sponsoredLimit?: number;
  /** Service-area radius for organic matching. */
  radiusMiles?: number;
};

const DEFAULT_LIMIT = 3;
const DEFAULT_SPONSORED_LIMIT = 2;
const DEFAULT_RADIUS_MILES = 25;
const ORGANIC_FETCH_LIMIT = 24;

/** Pull sponsored placements; never let a sponsored failure hide organic ones. */
async function fetchSponsored(
  supabase: SupabaseClient,
  query: LocalExpertsQuery,
  categories: string[],
  sponsoredLimit: number,
) {
  try {
    return await getFeaturedExperts(supabase, {
      postcodeDistrict: query.postcodeDistrict ?? null,
      town: query.town ?? null,
      region: query.region ?? null,
      categories,
      limit: sponsoredLimit,
    });
  } catch {
    return [];
  }
}

/** Pull organic verified, location-matched traders. */
async function fetchOrganic(
  supabase: SupabaseClient,
  query: LocalExpertsQuery,
  categories: string[],
): Promise<LocalExpertRow[]> {
  try {
    // Organic providers store no town/region — only `service_postcodes` and a
    // PostGIS `base_location`. Location is matched on those; town/region are
    // used only for the sponsored tier (see fetchSponsored).
    const { data, error } = await supabase.rpc("local_experts_for_property", {
      p_postcode_district: query.postcodeDistrict ?? null,
      p_lat: query.lat ?? null,
      p_lng: query.lng ?? null,
      p_categories: categories,
      p_radius_miles: query.radiusMiles ?? DEFAULT_RADIUS_MILES,
      p_limit: ORGANIC_FETCH_LIMIT,
    });
    if (error) return [];
    return (data ?? []) as LocalExpertRow[];
  } catch {
    return [];
  }
}

export async function getLocalExperts(
  supabase: SupabaseClient,
  query: LocalExpertsQuery,
): Promise<LocalExpert[]> {
  const limit = query.limit ?? DEFAULT_LIMIT;
  const sponsoredLimit = query.sponsoredLimit ?? DEFAULT_SPONSORED_LIMIT;
  const categoryOrder = categoryPriority(query.listingType, query.hasRenovationPotential);
  const categories = categoryOrder.map((c) => c as string);

  const [sponsored, organic] = await Promise.all([
    fetchSponsored(supabase, query, categories, sponsoredLimit),
    fetchOrganic(supabase, query, categories),
  ]);

  return blendLocalExperts({
    sponsored,
    organic,
    limit,
    sponsoredLimit,
    categoryOrder,
  });
}
