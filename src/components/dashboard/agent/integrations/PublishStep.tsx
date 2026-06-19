"use client";

import type { FeedImportReview } from "./types";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Search, MapPin, RefreshCw } from "lucide-react";

type PublishStepProps = Readonly<{
  publishedCount: number;
  review: FeedImportReview;
  onSyncAgain: () => void;
}>;

export function PublishStep({ publishedCount, review, onSyncAgain }: PublishStepProps) {
  const items = review.items;

  // published_count from the publish response (passed as prop)
  const published = publishedCount;

  // Geocoded: published items that had coordinates.
  // We count items with a valid status (not withdrawn/error) that have coords.
  const geocodedItems = items.filter(
    (i) =>
      i.validation_errors.length === 0 &&
      i.status !== "withdrawn" &&
      i.listing.latitude != null &&
      i.listing.longitude != null,
  );
  // Cap geocoded display at published count — we can only know about items
  // in this run's review object.
  const geocoded = Math.min(geocodedItems.length, published);

  return (
    <div className="space-y-8">
      {/* Success banner */}
      <div className="flex items-start gap-4 rounded-xl border border-green-200 bg-green-50 p-5 dark:border-green-800 dark:bg-green-900/20">
        <CheckCircle2
          className="mt-0.5 size-6 shrink-0 text-green-600 dark:text-green-400"
          aria-hidden
        />
        <div>
          <p className="text-base font-semibold text-green-800 dark:text-green-200">
            {published} listing{published !== 1 ? "s" : ""} published
          </p>
          <p className="mt-1 text-sm text-green-700 dark:text-green-300">
            Your portfolio is live. Listings are now searchable on TrueDeed.
          </p>
        </div>
      </div>

      {/* Post-publish summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={CheckCircle2}
          iconClass="text-green-600 dark:text-green-400"
          label="Published"
          value={String(published)}
          sub="listings added to your portfolio"
        />
        <SummaryCard
          icon={Search}
          iconClass="text-brand-primary dark:text-brand-primary-light"
          label="Search index"
          value={String(published)}
          sub="listings added to search"
        />
        <SummaryCard
          icon={MapPin}
          iconClass="text-brand-secondary"
          label="On map"
          value={`${geocoded} of ${published}`}
          sub="geocoded and visible on the map"
        />
      </div>

      {/* Blocked items note (from run.error_items) */}
      {review.run.error_items > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            {review.run.error_items} listing{review.run.error_items !== 1 ? "s" : ""} were not published
          </p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
            These had validation errors. Review the listing details in the Review step to see what needs fixing,
            then sync again once the issues are resolved in your source CRM.
          </p>
        </div>
      )}

      {/* Next steps */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Next steps
        </h3>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onSyncAgain}
          >
            <RefreshCw className="size-4" aria-hidden />
            Sync again
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          To view or manage your published listings, visit your agent listings page from the dashboard navigation.
          To resolve blocked items, use the Review step above and correct the issues in your source CRM before re-syncing.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary card
// ---------------------------------------------------------------------------

function SummaryCard({
  icon: Icon,
  iconClass,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  iconClass: string;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
      <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground`}>
        <Icon className={`size-4 ${iconClass}`} aria-hidden />
        {label}
      </div>
      <p className="text-3xl font-bold tabular-nums text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
