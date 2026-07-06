/**
 * Honest Agent Awards scoring service (Influence Strategy Phase 3, item 3.5).
 *
 * PURE functions only — no I/O, no Supabase. The DB refresh function
 * `refresh_agent_award_scores` (supabase/migrations/*_agent_award_scores.sql)
 * is the production computer; these builders are the disclosed, fixture-tested
 * specification of the same rules, plus the shaping layer the agent dashboard
 * uses to explain an agency's standing.
 *
 * THE RULES (non-negotiable):
 *  - Scores come from public transaction data and TrueDeed listings ONLY.
 *    There are no vote inputs anywhere in this module — awards are NEVER
 *    ranked on votes, and there is no payment of any kind to enter.
 *  - COMPUTE-AND-SUPPRESS: every metric is computed for every agency, but an
 *    agency below the disclosed `AWARD_MIN_SAMPLE` threshold is EXCLUDED from
 *    ranking, with the exclusion reason carried in the output type so their
 *    dashboard can tell them exactly why (and what they need).
 *  - FALL-THROUGH RATE IS DROPPED FOR YEAR 1: the fall-through metric
 *    (sales agreed that never complete) needs `transaction_milestones` /
 *    `agent_sale_progressions` coverage, and as of 2026-07-03 those tables
 *    hold 0 and 2 rows respectively — nowhere near enough to score anyone
 *    honestly. It is stated as dropped on the methodology page and will be
 *    reconsidered for year 2 when progression coverage exists.
 *
 * Kept free of "server-only" (like reality-gap-thresholds) so pages and the
 * dashboard panel can quote the disclosed constants directly.
 */

/**
 * Disclosed minimum sample per agency per metric — below this the agency is
 * excluded from ranking (compute-and-suppress). 5 is deliberately lower than
 * the report-level thresholds (matched_pair 10, time-to-sell 15) because
 * award scores are per-agency standings shown to that agency, not published
 * area statistics — but a median over fewer than 5 observations is too easy
 * for a single sale to swing, so nothing below 5 is ever ranked.
 */
export const AWARD_MIN_SAMPLE = 5;

/** An active sale listing older than this counts as stale (listing hygiene). */
export const STALE_LISTING_DAYS = 180;

/** Mirrors agent_award_scores computation version for the methodology page. */
export const AWARD_METHODOLOGY_VERSION = 1;

/**
 * The three year-1 metrics. Fall-through rate is intentionally ABSENT — see
 * the module header: dropped for year 1 due to thin progression coverage.
 */
export const AWARD_METRICS = [
  "pricing_accuracy",
  "time_to_sell",
  "listing_hygiene",
] as const;

export type AwardMetric = (typeof AWARD_METRICS)[number];

export const AWARD_METRIC_LABELS: Record<AwardMetric, string> = {
  pricing_accuracy: "Pricing accuracy",
  time_to_sell: "Time to sell vs local median",
  listing_hygiene: "Listing hygiene",
};

/**
 * Why an agency is excluded from a metric's ranking:
 *  - insufficient_sample: fewer than AWARD_MIN_SAMPLE observations.
 *  - no_baseline: the metric needs a local median baseline that has not
 *    cleared its own suppression threshold yet (time-to-sell).
 */
export type AwardExclusionReason = "insufficient_sample" | "no_baseline";

export type AgencyMetricScore = {
  agencyId: string;
  metric: AwardMetric;
  /**
   * Metric value; lower is always better. null when it cannot be computed.
   *  - pricing_accuracy: median |final asking − PPD sold| as % of sold price.
   *  - time_to_sell: agency median days to completion minus local median
   *    (negative = faster than the local market).
   *  - listing_hygiene: % of listings that are withdrawn or stale.
   */
  value: number | null;
  sampleN: number;
  /** True only when the agency clears the disclosed sample threshold. */
  eligible: boolean;
  exclusionReason: AwardExclusionReason | null;
  /** 1-based rank among ELIGIBLE agencies only; null when excluded. */
  rank: number | null;
};

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

/** One confirmed listing↔completion pair (ppd_match_candidates 'confirmed'). */
export type PricingPairInput = {
  agencyId: string;
  askingPounds: number;
  soldPounds: number;
};

/** One completed sale: days from listed_date (went on market) to HMLR transfer date. */
export type TimeToSellInput = {
  agencyId: string;
  daysToSell: number;
};

/** One listing snapshot for the hygiene metric. */
export type ListingHygieneInput = {
  agencyId: string;
  status: string;
  daysSinceListed: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function groupByAgency<T extends { agencyId: string }>(
  inputs: readonly T[],
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const input of inputs) {
    const existing = groups.get(input.agencyId);
    if (existing) {
      groups.set(input.agencyId, [...existing, input]);
    } else {
      groups.set(input.agencyId, [input]);
    }
  }
  return groups;
}

/**
 * Assigns 1-based ranks to eligible scores (value ascending — lower is
 * better — with agencyId as the deterministic tie-break), leaving excluded
 * agencies unranked but PRESENT in the output (compute-and-suppress).
 */
function rankScores(scores: readonly AgencyMetricScore[]): AgencyMetricScore[] {
  const eligible = scores
    .filter((score) => score.eligible && score.value !== null)
    .sort(
      (a, b) =>
        (a.value as number) - (b.value as number) ||
        a.agencyId.localeCompare(b.agencyId),
    )
    .map((score, index) => ({ ...score, rank: index + 1 }));
  const excluded = scores
    .filter((score) => !(score.eligible && score.value !== null))
    .sort((a, b) => a.agencyId.localeCompare(b.agencyId));
  return [...eligible, ...excluded];
}

// ---------------------------------------------------------------------------
// Pure metric builders
// ---------------------------------------------------------------------------

/**
 * Pricing accuracy: per agency, the median absolute gap between the final
 * asking price and the confirmed PPD sold price, as a % of the sold price.
 * Lower = more honest pricing. Invalid pairs (non-positive or non-finite
 * prices) are dropped before counting toward the sample.
 *
 * Prod reality check (2026-07-03): ppd_match_candidates has 0 'confirmed'
 * rows, so this computes to an empty/excluded set — by design it suppresses
 * rather than fabricates.
 */
export function buildPricingAccuracyScores(
  pairs: readonly PricingPairInput[],
): AgencyMetricScore[] {
  const valid = pairs.filter(
    (pair) =>
      Number.isFinite(pair.askingPounds) &&
      Number.isFinite(pair.soldPounds) &&
      pair.askingPounds > 0 &&
      pair.soldPounds > 0,
  );
  const scores = [...groupByAgency(valid).entries()].map(
    ([agencyId, agencyPairs]): AgencyMetricScore => {
      const gaps = agencyPairs.map(
        (pair) => (Math.abs(pair.askingPounds - pair.soldPounds) / pair.soldPounds) * 100,
      );
      const sampleN = agencyPairs.length;
      const eligible = sampleN >= AWARD_MIN_SAMPLE;
      const medianGap = median(gaps);
      return {
        agencyId,
        metric: "pricing_accuracy",
        value: medianGap === null ? null : round2(medianGap),
        sampleN,
        eligible,
        exclusionReason: eligible ? null : "insufficient_sample",
        rank: null,
      };
    },
  );
  return rankScores(scores);
}

/**
 * Time to sell vs local median: per agency, median days from listing
 * (listed_date) to completion minus the local median (negative = faster than
 * the market). `localMedianDays` is the published baseline read from
 * time_to_sell_snapshots (the best available unsuppressed row for the
 * period — national at current data volume), NOT recomputed from raw pairs.
 * When no unsuppressed snapshot exists (1 suppressed row as of 2026-07-03),
 * every agency is excluded with reason "no_baseline" rather than being
 * ranked against nothing.
 */
export function buildTimeToSellScores(
  observations: readonly TimeToSellInput[],
  localMedianDays: number | null,
): AgencyMetricScore[] {
  const hasBaseline = localMedianDays !== null && Number.isFinite(localMedianDays);
  const valid = observations.filter(
    (obs) => Number.isFinite(obs.daysToSell) && obs.daysToSell >= 0,
  );
  const scores = [...groupByAgency(valid).entries()].map(
    ([agencyId, agencyObs]): AgencyMetricScore => {
      const sampleN = agencyObs.length;
      const hasSample = sampleN >= AWARD_MIN_SAMPLE;
      const eligible = hasSample && hasBaseline;
      const agencyMedian = median(agencyObs.map((obs) => obs.daysToSell));
      // insufficient_sample takes precedence: "you need ≥N matched sales" is
      // the actionable message for the agency.
      const exclusionReason: AwardExclusionReason | null = eligible
        ? null
        : hasSample
          ? "no_baseline"
          : "insufficient_sample";
      return {
        agencyId,
        metric: "time_to_sell",
        value:
          agencyMedian === null || !hasBaseline
            ? null
            : round2(agencyMedian - (localMedianDays as number)),
        sampleN,
        eligible,
        exclusionReason,
        rank: null,
      };
    },
  );
  return rankScores(scores);
}

/**
 * Listing hygiene: per agency, the % of listings that are withdrawn or stale
 * (active for more than STALE_LISTING_DAYS). Lower = cleaner book. Sample is
 * the agency's listing count, so at least AWARD_MIN_SAMPLE listings are
 * needed before the share means anything.
 */
export function buildListingHygieneScores(
  listings: readonly ListingHygieneInput[],
): AgencyMetricScore[] {
  const valid = listings.filter((listing) => Number.isFinite(listing.daysSinceListed));
  const scores = [...groupByAgency(valid).entries()].map(
    ([agencyId, agencyListings]): AgencyMetricScore => {
      const sampleN = agencyListings.length;
      const eligible = sampleN >= AWARD_MIN_SAMPLE;
      const flagged = agencyListings.filter(
        (listing) =>
          listing.status === "withdrawn" ||
          (listing.status === "active" && listing.daysSinceListed > STALE_LISTING_DAYS),
      ).length;
      return {
        agencyId,
        metric: "listing_hygiene",
        value: round2((flagged / sampleN) * 100),
        sampleN,
        eligible,
        exclusionReason: eligible ? null : "insufficient_sample",
        rank: null,
      };
    },
  );
  return rankScores(scores);
}

// ---------------------------------------------------------------------------
// Dashboard standing (shapes stored agent_award_scores rows)
// ---------------------------------------------------------------------------

/** Raw agent_award_scores row (table is untyped — hand-written shape). */
export type AwardScoreRow = {
  agency_id: string;
  period: string;
  metric: string;
  value: number | string | null;
  sample_n: number;
  eligibility_flag: boolean;
  computed_at: string;
};

export type AwardMetricStanding = {
  metric: AwardMetric;
  label: string;
  value: number | null;
  sampleN: number;
  eligible: boolean;
  /** Non-null exactly when the agency is excluded — the honest "why". */
  exclusionReason: AwardExclusionReason | null;
  computedAt: string | null;
};

export type AgencyAwardStanding = {
  /** Latest period present in the rows; null when no scores exist yet. */
  period: string | null;
  /** One entry per AWARD_METRICS, in declaration order — never sparse. */
  metrics: AwardMetricStanding[];
};

/**
 * Pure builder: shapes stored score rows into the agency's standing for the
 * dashboard panel. Metrics with no row (or below threshold) come back as
 * excluded with "insufficient_sample" so the panel can always explain the
 * honest "not enough data yet — you need ≥N" state instead of hiding.
 */
export function buildAgencyAwardStanding(
  rows: readonly AwardScoreRow[],
): AgencyAwardStanding {
  const period = rows.length === 0 ? null : [...rows.map((row) => row.period)].sort().at(-1) ?? null;
  const periodRows = rows.filter((row) => row.period === period);

  const metrics = AWARD_METRICS.map((metric): AwardMetricStanding => {
    const row = periodRows.find((candidate) => candidate.metric === metric);
    if (!row) {
      return {
        metric,
        label: AWARD_METRIC_LABELS[metric],
        value: null,
        sampleN: 0,
        eligible: false,
        exclusionReason: "insufficient_sample",
        computedAt: null,
      };
    }
    const numeric = row.value === null ? null : Number(row.value);
    const value = numeric !== null && Number.isFinite(numeric) ? numeric : null;
    const eligible = row.eligibility_flag && value !== null;
    return {
      metric,
      label: AWARD_METRIC_LABELS[metric],
      value,
      sampleN: row.sample_n,
      eligible,
      exclusionReason: eligible
        ? null
        : row.sample_n < AWARD_MIN_SAMPLE
          ? "insufficient_sample"
          : "no_baseline",
      computedAt: row.computed_at,
    };
  });

  return { period, metrics };
}
