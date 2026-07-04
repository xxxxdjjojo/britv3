/**
 * Pure ranking logic for the Top Properties lists. No IO — the service layer
 * fetches candidates and this module decides who qualifies, in what order,
 * and with what human-readable reason.
 *
 * Honesty rules (see docs/TOP_PROPERTIES.md):
 *  - A candidate missing the signal a list ranks by is EXCLUDED, never
 *    defaulted (no floor area → not on the £/sqft list).
 *  - Every `reason` string is built only from real values on the candidate.
 */

import type {
  TopListCandidate,
  TopListCategory,
  TopListItem,
} from "@/lib/top-properties/types";

/** Freshness half-life-ish constant: score = exp(-days/14). */
const FRESHNESS_DECAY_DAYS = 14;

/** A home must ask at least this far below the benchmark to be "below" it. */
const MIN_BENCHMARK_DELTA = -0.02;

const MS_PER_DAY = 86_400_000;

type EngagementCounts = {
  viewCount: number;
  favoriteCount: number;
  enquiryCount: number;
};

/**
 * Blended engagement score: log-scaled so one viral listing cannot drown out
 * the rest, with saves weighted double (a save is stronger intent than a view).
 */
export function buyerInterestScore(counts: EngagementCounts): number {
  return (
    Math.log1p(counts.viewCount) +
    2 * Math.log1p(counts.favoriteCount) +
    Math.log1p(counts.enquiryCount)
  );
}

/** Asking price per square foot, or null when no floor area is recorded. */
export function pricePerSqft(
  price: number,
  squareFootage: number | null,
): number | null {
  if (!squareFootage || squareFootage <= 0) return null;
  return price / squareFootage;
}

/**
 * Fractional price reduction, or null when there is no genuine reduction
 * (unchanged or increased prices never count as a "drop").
 */
export function priceDropPct(
  oldPrice: number,
  newPrice: number,
): number | null {
  if (oldPrice <= 0 || newPrice <= 0 || newPrice >= oldPrice) return null;
  return (oldPrice - newPrice) / oldPrice;
}

/** Exponential decay from the listed date: 1 today → ~0.12 after a month. */
export function freshnessScore(listedDate: string | null, now: Date): number {
  if (!listedDate) return 0;
  const listed = new Date(listedDate).getTime();
  if (Number.isNaN(listed)) return 0;
  const days = Math.max(0, (now.getTime() - listed) / MS_PER_DAY);
  return Math.exp(-days / FRESHNESS_DECAY_DAYS);
}

/**
 * Fraction of key listing fields present (0–1). Used only as a soft factor in
 * blended (city) rankings — it never fabricates a missing field.
 */
export function dataQualityScore(candidate: TopListCandidate): number {
  const checks = [
    candidate.price > 0,
    Boolean(candidate.city),
    Boolean(candidate.postcode),
    Boolean(candidate.propertyType),
    candidate.bedrooms != null,
    candidate.bathrooms != null,
    candidate.squareFootage != null,
    candidate.imageUrl != null,
    candidate.listedDate != null,
  ];
  return checks.filter(Boolean).length / checks.length;
}

/* ----------------------------------------------------------- formatting */

function formatPounds(value: number): string {
  return `£${Math.round(value).toLocaleString("en-GB")}`;
}

function formatListedDate(listedDate: string): string {
  return new Date(listedDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function engagementReason(candidate: TopListCandidate): string {
  return [
    `${candidate.viewCount.toLocaleString("en-GB")} views`,
    `${candidate.favoriteCount.toLocaleString("en-GB")} saves`,
    `${candidate.enquiryCount.toLocaleString("en-GB")} enquiries`,
  ].join(" · ");
}

/* -------------------------------------------------------------- ranking */

/** Score + reason for one candidate on one list, or null when ineligible. */
function evaluate(
  category: TopListCategory,
  candidate: TopListCandidate,
  now: Date,
): { score: number; reason: string } | null {
  switch (category.kind) {
    case "value": {
      const benchmark = candidate.benchmark;
      if (
        !benchmark ||
        benchmark.confidence === "Insufficient" ||
        benchmark.deltaPct > MIN_BENCHMARK_DELTA
      ) {
        return null;
      }
      const pctBelow = Math.round(-benchmark.deltaPct * 100);
      return {
        score: -benchmark.deltaPct,
        reason: `${pctBelow}% below local benchmark (${benchmark.confidence} confidence)`,
      };
    }
    case "ppsf": {
      const ppsf = pricePerSqft(candidate.price, candidate.squareFootage);
      if (ppsf == null) return null;
      // Ascending: the cheapest £/sqft ranks first.
      return { score: -ppsf, reason: `${formatPounds(ppsf)} per sq ft` };
    }
    case "interest": {
      const score = buyerInterestScore(candidate);
      if (score <= 0) return null;
      return { score, reason: engagementReason(candidate) };
    }
    case "saved": {
      if (candidate.favoriteCount < 1) return null;
      return {
        score: candidate.favoriteCount,
        reason: `${candidate.favoriteCount.toLocaleString("en-GB")} ${
          candidate.favoriteCount === 1 ? "save" : "saves"
        }`,
      };
    }
    case "newest": {
      if (!candidate.listedDate) return null;
      const listed = new Date(candidate.listedDate).getTime();
      if (Number.isNaN(listed)) return null;
      return {
        score: listed,
        reason: `Listed ${formatListedDate(candidate.listedDate)}`,
      };
    }
    case "largest": {
      if (!candidate.squareFootage || candidate.squareFootage <= 0) return null;
      return {
        score: candidate.squareFootage,
        reason: `${candidate.squareFootage.toLocaleString("en-GB")} sq ft`,
      };
    }
    case "expensive":
      return {
        score: candidate.price,
        reason: `${formatPounds(candidate.price)} asking price`,
      };
    case "price_drop": {
      if (!candidate.priceDrop) return null;
      const pct = priceDropPct(
        candidate.priceDrop.oldPrice,
        candidate.priceDrop.newPrice,
      );
      if (pct == null) return null;
      return {
        score: pct,
        reason: `${Math.round(pct * 100)}% price reduction (was ${formatPounds(
          candidate.priceDrop.oldPrice,
        )})`,
      };
    }
    case "city": {
      if (
        !category.city ||
        candidate.city.toLowerCase() !== category.city
      ) {
        return null;
      }
      const interest = buyerInterestScore(candidate);
      const score =
        (1 + interest) *
        (0.5 + 0.5 * freshnessScore(candidate.listedDate, now)) *
        dataQualityScore(candidate);
      const reason =
        interest > 0
          ? engagementReason(candidate)
          : candidate.listedDate
            ? `Listed ${formatListedDate(candidate.listedDate)}`
            : `${formatPounds(candidate.price)} asking price`;
      return { score, reason };
    }
  }
}

type RankOptions = {
  now: Date;
  /** Cap on how many items to return (defaults to all eligible). */
  limit?: number;
};

/**
 * Filters candidates to the ones genuinely eligible for the category, orders
 * them by the category's signal, and assigns sequential ranks. Rentals and
 * homes without a positive asking price never rank — every list is sale-only.
 */
export function rankCandidates(
  category: TopListCategory,
  candidates: TopListCandidate[],
  options: RankOptions,
): TopListItem[] {
  const scored = candidates.flatMap((candidate) => {
    if (candidate.listingType !== "sale" || candidate.price <= 0) return [];
    const evaluated = evaluate(category, candidate, options.now);
    if (!evaluated) return [];
    return [{ candidate, ...evaluated }];
  });

  scored.sort(
    (a, b) =>
      b.score - a.score || a.candidate.listingId.localeCompare(b.candidate.listingId),
  );

  const limited =
    options.limit != null ? scored.slice(0, options.limit) : scored;

  return limited.map((entry, index) => ({
    ...entry.candidate,
    rank: index + 1,
    score: entry.score,
    reason: entry.reason,
  }));
}
