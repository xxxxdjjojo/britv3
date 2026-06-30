/**
 * placement-service.ts
 *
 * Read/surfacing layer for Featured Local Experts. Fetches eligibility-filtered
 * candidates via the `featured_experts_for` RPC, applies the hybrid trust+paid
 * ranking, de-duplicates by provider, and returns premium display models.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import { rankExperts } from "@/lib/placements/ranking";
import { rowToCandidate, rowToExpert } from "@/lib/placements/transform";
import type { FeaturedExpert, FeaturedExpertRow } from "@/types/sponsored-placements";

export type FeaturedExpertsQuery = {
  postcodeDistrict?: string | null;
  town?: string | null;
  region?: string | null;
  categories?: string[] | null;
  /** Number of cards to display. */
  limit?: number;
  /** How many candidates to pull from the DB before ranking. */
  fetchLimit?: number;
};

const DEFAULT_DISPLAY_LIMIT = 3;
const DEFAULT_FETCH_LIMIT = 24;

export async function getFeaturedExperts(
  supabase: SupabaseClient,
  query: FeaturedExpertsQuery,
): Promise<FeaturedExpert[]> {
  const { data, error } = await supabase.rpc("featured_experts_for", {
    p_postcode_district: query.postcodeDistrict ?? null,
    p_town: query.town ?? null,
    p_region: query.region ?? null,
    p_categories: query.categories ?? null,
    p_limit: query.fetchLimit ?? DEFAULT_FETCH_LIMIT,
  });

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as FeaturedExpertRow[];
  if (rows.length === 0) return [];

  const rowById = new Map(rows.map((r) => [r.placement_id, r]));
  const ranked = rankExperts(rows.map(rowToCandidate), rows.length);

  const limit = query.limit ?? DEFAULT_DISPLAY_LIMIT;
  const seenProviders = new Set<string>();
  const experts: FeaturedExpert[] = [];

  for (const candidate of ranked) {
    if (seenProviders.has(candidate.providerId)) continue;
    const row = rowById.get(candidate.placementId);
    if (!row) continue;
    seenProviders.add(candidate.providerId);
    experts.push(rowToExpert(row));
    if (experts.length >= limit) break;
  }

  return experts;
}
