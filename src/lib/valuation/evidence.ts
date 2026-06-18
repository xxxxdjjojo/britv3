/**
 * Evidence-quality and adaptive fallback-level classification.
 *
 * Evidence quality is NOT an accuracy percentage — it describes how trustworthy
 * the supporting evidence is. Weak evidence must lower the rating (and widen the
 * range), and no evidence at all must decline to produce a number.
 */
import type { EvidenceQuality, FallbackLevel } from "@/types/valuation";

const A_LEVEL_MAX_DISTANCE_M = 1000;
const RECENT_MONTHS = 24;
const STRONG_EFFECTIVE_COUNT = 4;
const VERY_STRONG_EFFECTIVE_COUNT = 5;
const SAME_TYPE_THRESHOLD = 0.7;

export type EvidenceContext = Readonly<{
  hasExactPriorSale: boolean;
  comparableCount: number;
  effectiveComparableCount: number;
  nearestDistanceM: number | null;
  medianMonthsAgo: number | null;
  sameTypeShare: number;
}>;

export type EvidenceVerdict = Readonly<{
  evidenceQuality: EvidenceQuality;
  fallbackLevel: FallbackLevel;
}>;

export function classifyEvidence(ctx: EvidenceContext): EvidenceVerdict {
  if (ctx.comparableCount === 0) {
    return { evidenceQuality: "unavailable", fallbackLevel: "E" };
  }

  const recent = (ctx.medianMonthsAgo ?? Number.POSITIVE_INFINITY) <= RECENT_MONTHS;
  const near = (ctx.nearestDistanceM ?? Number.POSITIVE_INFINITY) <= A_LEVEL_MAX_DISTANCE_M;
  const strong =
    ctx.effectiveComparableCount >= STRONG_EFFECTIVE_COUNT &&
    ctx.sameTypeShare >= SAME_TYPE_THRESHOLD;

  // Level A — exact prior sale anchored by strong, nearby comparables.
  if (ctx.hasExactPriorSale && strong && near) {
    return { evidenceQuality: "high", fallbackLevel: "A" };
  }
  // High quality without a prior sale requires very strong, near, recent evidence.
  if (strong && near && recent && ctx.effectiveComparableCount >= VERY_STRONG_EFFECTIVE_COUNT) {
    return { evidenceQuality: "high", fallbackLevel: ctx.hasExactPriorSale ? "A" : "B" };
  }
  // Level B/C — usable but imperfect.
  if (ctx.effectiveComparableCount >= 3 && ctx.comparableCount >= 4) {
    return { evidenceQuality: "medium", fallbackLevel: near && recent ? "B" : "C" };
  }
  if (ctx.comparableCount >= 3) {
    return { evidenceQuality: "medium", fallbackLevel: "C" };
  }
  // Level D — sparse, distant, or stale evidence.
  return { evidenceQuality: "low", fallbackLevel: "D" };
}
