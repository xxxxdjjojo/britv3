/**
 * local-experts.ts
 *
 * Pure logic for the property page's "Local experts who can help with this
 * property" section: which trade categories to prioritise for a given property,
 * how to score an organic trader, and how to blend a capped number of sponsored
 * cards with organic verified traders.
 *
 * Design rule (mirrors the sponsored-placement ranking): paid placement buys a
 * card into the set and a top slot, but it never bypasses verification, and the
 * organic order is decided by trust + relevance — a poor trader cannot outrank a
 * good one just because they paid.
 */

import type { ServiceCategory } from "@/types/marketplace";
import type { LocationMatch } from "@/lib/placements/ranking";
import type { FeaturedExpert } from "@/types/sponsored-placements";
import type { LocalExpert, LocalExpertRow } from "@/types/local-experts";
import type { ListingType } from "@/lib/placements/relevance";

// ---------------------------------------------------------------------------
// Category prioritisation
// ---------------------------------------------------------------------------
// Spec categories are mapped onto the existing `service_category` enum so they
// align with real trader profiles. Categories without an enum value are folded
// into their nearest equivalent (roofer / bathroom / kitchen renovator → builder,
// decorator → painter; broadband installer / furniture have no equivalent).

/** Renovation / extension trades — who actually does the work. */
const RENOVATION_CATEGORIES: readonly ServiceCategory[] = [
  "builder",
  "architect",
  "electrician",
  "plumber",
  "plasterer",
  "carpenter",
  "painter",
  "landscaping",
];

/** High-intent buying journey: due diligence, finance, legal, the move. */
const SALE_CATEGORIES: readonly ServiceCategory[] = [
  "surveying",
  "mortgage_broker",
  "conveyancing",
  "builder",
  "architect",
  "electrician",
  "plumber",
  "painter",
  "moving_company",
];

/** Move-in journey for renters. */
const RENT_CATEGORIES: readonly ServiceCategory[] = [
  "moving_company",
  "cleaning",
  "handyman",
  "locksmith",
];

function dedupe(categories: readonly ServiceCategory[]): ServiceCategory[] {
  const seen = new Set<ServiceCategory>();
  const out: ServiceCategory[] = [];
  for (const c of categories) {
    if (!seen.has(c)) {
      seen.add(c);
      out.push(c);
    }
  }
  return out;
}

/**
 * The ordered list of relevant trade categories for a property. When a sale has
 * renovation potential, renovation trades lead (the section sits right after the
 * Renovation Potential block), then the rest of the buying journey follows.
 */
export function categoryPriority(
  listingType: ListingType,
  hasRenovationPotential: boolean,
): ServiceCategory[] {
  if (listingType === "rent") return dedupe(RENT_CATEGORIES);
  if (hasRenovationPotential) return dedupe([...RENOVATION_CATEGORIES, ...SALE_CATEGORIES]);
  return dedupe(SALE_CATEGORIES);
}

// ---------------------------------------------------------------------------
// Organic trust + relevance scoring
// ---------------------------------------------------------------------------

const NEUTRAL_RATING = 3.6;
const MAX_REVIEW_VOLUME = 50;
const MAX_COMPLETED_JOBS = 100;

const LOCATION_WEIGHT: Record<LocationMatch, number> = {
  postcode: 1,
  town: 0.7,
  region: 0.4,
  none: 0,
};

const WEIGHTS = {
  rating: 0.28,
  location: 0.2,
  category: 0.16,
  completeness: 0.12,
  response: 0.08,
  reviewVolume: 0.08,
  completedJobs: 0.08,
} as const;

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function rowCompleteness(row: LocalExpertRow): number {
  const checks = [
    Boolean(row.business_description),
    (row.services?.length ?? 0) > 0,
    (row.service_postcodes?.length ?? 0) > 0,
    Boolean(row.avatar_url),
    (row.qualifications?.length ?? 0) > 0,
    (row.years_in_business ?? 0) > 0,
  ];
  return checks.filter(Boolean).length / checks.length;
}

/** Category relevance in [0, 1]: 1 for the top-priority category, decaying to 0. */
function categoryRelevance(
  category: ServiceCategory | null,
  categoryOrder: readonly ServiceCategory[],
): number {
  if (!category || categoryOrder.length === 0) return 0;
  const index = categoryOrder.indexOf(category);
  if (index < 0) return 0;
  return 1 - index / categoryOrder.length;
}

/** Blended trust + relevance score in [0, 1] for an organic trader row. */
export function scoreLocalRow(
  row: LocalExpertRow,
  categoryOrder: readonly ServiceCategory[],
): number {
  const ratingNorm = clamp01((row.average_rating ?? NEUTRAL_RATING) / 5);
  const locationNorm = LOCATION_WEIGHT[row.location_match] ?? 0;
  const relevanceNorm = categoryRelevance(row.primary_category, categoryOrder);
  const completenessNorm = clamp01(rowCompleteness(row));
  const responseNorm = clamp01((row.response_rate ?? 50) / 100);
  const reviewVolumeNorm = clamp01(Math.min(row.total_reviews ?? 0, MAX_REVIEW_VOLUME) / MAX_REVIEW_VOLUME);
  const completedJobsNorm = clamp01(
    Math.min(row.completed_jobs_count ?? 0, MAX_COMPLETED_JOBS) / MAX_COMPLETED_JOBS,
  );

  return clamp01(
    WEIGHTS.rating * ratingNorm +
      WEIGHTS.location * locationNorm +
      WEIGHTS.category * relevanceNorm +
      WEIGHTS.completeness * completenessNorm +
      WEIGHTS.response * responseNorm +
      WEIGHTS.reviewVolume * reviewVolumeNorm +
      WEIGHTS.completedJobs * completedJobsNorm,
  );
}

// ---------------------------------------------------------------------------
// Mapping + blending
// ---------------------------------------------------------------------------

function humanizeCategory(value: string): string {
  const label = value.replace(/_/g, " ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Map an organic RPC row to a (non-sponsored) card model. */
export function rowToLocalExpert(row: LocalExpertRow): LocalExpert {
  const category = row.primary_category ?? (row.services ?? [])[0] ?? null;
  return {
    providerId: row.provider_id,
    slug: row.slug,
    businessName: row.business_name,
    avatarUrl: row.avatar_url,
    category,
    primaryService: humanizeCategory(category ?? "other"),
    averageRating: row.average_rating,
    totalReviews: row.total_reviews ?? 0,
    responseTimeHours: row.response_time_hours,
    yearsInBusiness: row.years_in_business,
    completedJobsCount: row.completed_jobs_count,
    serviceArea: (row.service_postcodes ?? [])[0] ?? null,
    valueProposition: row.business_description,
    isVerified: true,
    isSponsored: false,
    placementId: null,
  };
}

/** Map a sponsored placement card to the unified local-expert model. */
function sponsoredToLocalExpert(expert: FeaturedExpert): LocalExpert {
  return {
    providerId: expert.providerId,
    slug: expert.slug,
    businessName: expert.businessName,
    avatarUrl: expert.avatarUrl,
    category: expert.category,
    primaryService: expert.primaryService,
    averageRating: expert.averageRating,
    totalReviews: expert.totalReviews,
    responseTimeHours: expert.responseTimeHours,
    yearsInBusiness: null,
    completedJobsCount: null,
    serviceArea: expert.serviceArea,
    valueProposition: expert.valueProposition,
    isVerified: expert.isVerified,
    isSponsored: true,
    placementId: expert.placementId,
  };
}

export type BlendLocalExpertsInput = {
  /** Already ranked sponsored placements (verified, subscribed). */
  sponsored: readonly FeaturedExpert[];
  /** Organic candidate rows from `local_experts_for_property`. */
  organic: readonly LocalExpertRow[];
  /** Total cards to return. */
  limit: number;
  /** Max sponsored cards (keep it calm — 1–2). */
  sponsoredLimit: number;
  categoryOrder: readonly ServiceCategory[];
};

/**
 * Blend sponsored + organic into the final ordered card list:
 *   1. up to `sponsoredLimit` sponsored cards first (labelled),
 *   2. organic verified traders, de-duplicated against the sponsored providers,
 *      ordered by the blended trust + relevance score, filling up to `limit`.
 * Pure — does not mutate inputs.
 */
export function blendLocalExperts(input: BlendLocalExpertsInput): LocalExpert[] {
  const sponsoredCards = input.sponsored
    .slice(0, Math.max(0, input.sponsoredLimit))
    .map(sponsoredToLocalExpert);

  const sponsoredProviderIds = new Set(sponsoredCards.map((c) => c.providerId));

  const organicCards = input.organic
    .filter((row) => !sponsoredProviderIds.has(row.provider_id))
    .map((row) => ({ row, score: scoreLocalRow(row, input.categoryOrder) }))
    .sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      return a.row.provider_id.localeCompare(b.row.provider_id);
    })
    .map((scored) => rowToLocalExpert(scored.row));

  return [...sponsoredCards, ...organicCards].slice(0, Math.max(0, input.limit));
}
