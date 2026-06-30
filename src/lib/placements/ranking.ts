/**
 * ranking.ts
 *
 * Hybrid ranking for Featured Local Experts. Every candidate in the set has
 * already paid for a placement (eligibility — verified, active subscription,
 * approved, not suspended, serves location, category match — is enforced by the
 * `featured_experts_for` RPC). This module decides the ORDER within that paid
 * set, and the rule is deliberate:
 *
 *   Paid placement buys you into the set, but trust decides your rank.
 *   A poor trader must never outrank a good trader just because they paid.
 *
 * Admin levers (manual feature pin, priority override) sit above the organic
 * trust score so support/sales can correct edge cases, but they are explicit
 * and auditable rather than purchasable.
 */

export type LocationMatch = "postcode" | "town" | "region" | "none";

export type ExpertCandidate = {
  providerId: string;
  placementId: string;
  /** 0–5, or null for a provider with no reviews yet. */
  averageRating: number | null;
  totalReviews: number;
  /** 0–100, or null if unknown. */
  responseRate: number | null;
  /** 0–1 profile completeness. */
  profileCompleteness: number;
  locationMatch: LocationMatch;
  categoryMatch: boolean;
  /** Admin manually pinned this placement to the top. */
  adminFeatured: boolean;
  /** Admin numeric override; higher wins. null = no override. */
  priorityOverride: number | null;
  /** false → daily/monthly budget cap reached; must not be shown. */
  budgetRemaining: boolean;
};

// New providers (no reviews) get a neutral-positive prior so they aren't buried,
// but it sits below a genuinely well-reviewed trader.
const NEUTRAL_RATING = 3.6;
const MAX_REVIEW_VOLUME = 50;

const LOCATION_WEIGHT: Record<LocationMatch, number> = {
  postcode: 1,
  town: 0.7,
  region: 0.4,
  none: 0,
};

const WEIGHTS = {
  rating: 0.3,
  location: 0.25,
  completeness: 0.15,
  response: 0.1,
  reviewVolume: 0.1,
  category: 0.1,
} as const;

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

/** Blended trust + relevance score in [0, 1]. */
export function scoreCandidate(c: ExpertCandidate): number {
  const ratingNorm = clamp01((c.averageRating ?? NEUTRAL_RATING) / 5);
  const locationNorm = LOCATION_WEIGHT[c.locationMatch];
  const completenessNorm = clamp01(c.profileCompleteness);
  const responseNorm = clamp01((c.responseRate ?? 50) / 100);
  const reviewVolumeNorm = clamp01(Math.min(c.totalReviews, MAX_REVIEW_VOLUME) / MAX_REVIEW_VOLUME);
  const categoryNorm = c.categoryMatch ? 1 : 0;

  return clamp01(
    WEIGHTS.rating * ratingNorm +
      WEIGHTS.location * locationNorm +
      WEIGHTS.completeness * completenessNorm +
      WEIGHTS.response * responseNorm +
      WEIGHTS.reviewVolume * reviewVolumeNorm +
      WEIGHTS.category * categoryNorm,
  );
}

/**
 * Returns the candidates ordered for display, capped at `limit`. Candidates that
 * have exhausted their budget are dropped. Does not mutate the input.
 *
 * Order: admin-featured first, then admin priority override (desc), then the
 * blended trust score (desc), with a stable provider-id tiebreak.
 */
export function rankExperts(candidates: readonly ExpertCandidate[], limit: number): ExpertCandidate[] {
  const scored = candidates
    .filter((c) => c.budgetRemaining)
    .map((c) => ({ c, score: scoreCandidate(c) }));

  scored.sort((a, b) => {
    if (a.c.adminFeatured !== b.c.adminFeatured) return a.c.adminFeatured ? -1 : 1;
    const ap = a.c.priorityOverride ?? Number.NEGATIVE_INFINITY;
    const bp = b.c.priorityOverride ?? Number.NEGATIVE_INFINITY;
    if (ap !== bp) return bp - ap;
    if (a.score !== b.score) return b.score - a.score;
    return a.c.providerId.localeCompare(b.c.providerId);
  });

  return scored.slice(0, Math.max(0, limit)).map((s) => s.c);
}
