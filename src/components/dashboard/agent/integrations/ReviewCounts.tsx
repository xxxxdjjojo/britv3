"use client";

import type { FeedImportReview, FeedImportReviewItem } from "./types";

// ---------------------------------------------------------------------------
// Derived counts — every number traces to a real FeedImportReview field.
// ---------------------------------------------------------------------------

export type ReviewCountData = {
  /** run.total_items */
  source: number;
  /** run.eligible_items */
  eligible: number;
  /** run.error_items (items with validation_errors.length > 0) */
  blocked: number;
  /** items with status === "withdrawn" */
  withdrawn: number;
  /** eligible items where listing.media.length === 0 */
  missingMedia: number;
  /** eligible items where listing.latitude == null || listing.longitude == null */
  missingCoords: number;
  /** eligible items with missingMedia OR missingCoords */
  warnings: number;
};

export function deriveReviewCounts(review: FeedImportReview): ReviewCountData {
  const items: FeedImportReviewItem[] = review.items;

  const source = review.run.total_items;
  const eligible = review.run.eligible_items;
  const blocked = review.run.error_items;

  const withdrawn = items.filter((i) => i.status === "withdrawn").length;

  const eligibleItems = items.filter(
    (i) => i.validation_errors.length === 0 && i.status !== "withdrawn",
  );

  const missingMedia = eligibleItems.filter(
    (i) => (i.listing.media ?? []).length === 0,
  ).length;

  const missingCoords = eligibleItems.filter(
    (i) => i.listing.latitude == null || i.listing.longitude == null,
  ).length;

  const warnings = eligibleItems.filter(
    (i) =>
      (i.listing.media ?? []).length === 0 ||
      i.listing.latitude == null ||
      i.listing.longitude == null,
  ).length;

  return { source, eligible, blocked, withdrawn, missingMedia, missingCoords, warnings };
}

// ---------------------------------------------------------------------------
// ReviewCounts display component
// ---------------------------------------------------------------------------

type Stat = { label: string; value: number; tone: "neutral" | "positive" | "warning" | "error" };

function StatPill({ label, value, tone }: Stat) {
  const toneClass: Record<Stat["tone"], string> = {
    neutral: "bg-surface text-foreground ring-border",
    positive: "bg-green-50 text-green-800 ring-green-200 dark:bg-green-900/20 dark:text-green-300 dark:ring-green-800",
    warning: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:ring-amber-800",
    error: "bg-destructive/10 text-destructive ring-destructive/20 dark:ring-destructive/30",
  };
  return (
    <div className={`flex flex-col gap-0.5 rounded-lg px-4 py-3 ring-1 ${toneClass[tone]}`}>
      <span className="text-2xl font-bold tabular-nums leading-none">{value}</span>
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}

type ReviewCountsProps = Readonly<{ review: FeedImportReview }>;

export function ReviewCounts({ review }: ReviewCountsProps) {
  const c = deriveReviewCounts(review);

  const stats: Stat[] = [
    { label: "From source", value: c.source, tone: "neutral" },
    { label: "Eligible", value: c.eligible, tone: c.eligible > 0 ? "positive" : "neutral" },
    { label: "Blocked / errors", value: c.blocked, tone: c.blocked > 0 ? "error" : "positive" },
    { label: "Withdrawn", value: c.withdrawn, tone: c.withdrawn > 0 ? "warning" : "neutral" },
    { label: "Warnings (media/coords)", value: c.warnings, tone: c.warnings > 0 ? "warning" : "neutral" },
  ];

  return (
    <div className="flex flex-wrap gap-3" role="region" aria-label="Import summary counts">
      {stats.map((s) => (
        <StatPill key={s.label} {...s} />
      ))}
    </div>
  );
}
