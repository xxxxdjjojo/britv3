"use client";

import { useState } from "react";
import type { FeedImportReview, FeedImportReviewItem, ItemStatus } from "./types";
import { ReviewCounts } from "./ReviewCounts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, MapPin, ImageOff } from "lucide-react";

type ReviewStepProps = Readonly<{
  review: FeedImportReview;
  approving: boolean;
  publishing: boolean;
  onApprove: () => void;
  onPublish: () => void;
}>;

export function ReviewStep({
  review,
  approving,
  publishing,
  onApprove,
  onPublish,
}: ReviewStepProps) {
  const [expanded, setExpanded] = useState(false);

  const items = review.items;
  const branches = Array.from(
    new Set(items.map((i) => i.external_branch_id).filter(Boolean)),
  ) as string[];

  const approvedItems = items.filter((i) => i.status === "approved");
  const canPublish = approvedItems.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">
          Review imported listings
        </h3>
        <p className="text-sm text-muted-foreground">
          {branches.length > 0
            ? `Branch${branches.length > 1 ? "es" : ""}: ${branches.join(", ")} · `
            : ""}
          Run status: <span className="font-medium capitalize">{review.run.status}</span>
        </p>
      </div>

      {/* Counts — every figure derives from FeedImportReview */}
      <div data-testid="review-counts">
        <ReviewCounts review={review} />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          data-testid="approve-btn"
          disabled={approving || review.run.eligible_items === 0}
          onClick={onApprove}
        >
          {approving ? "Approving…" : `Approve ${review.run.eligible_items} eligible`}
        </Button>
        <Button
          type="button"
          variant="default"
          data-testid="publish-btn"
          disabled={publishing || !canPublish}
          onClick={onPublish}
        >
          {publishing ? "Publishing…" : `Publish ${approvedItems.length} approved`}
        </Button>
      </div>

      {/* Progressive-disclosure item list */}
      <div className="rounded-xl border border-border">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-foreground hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-expanded={expanded}
          aria-controls="review-item-list"
        >
          <span>
            {expanded ? "Hide" : "Show"} listing details
            <span className="ml-2 text-muted-foreground">({items.length} items)</span>
          </span>
          {expanded ? (
            <ChevronUp className="size-4 text-muted-foreground" aria-hidden />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
          )}
        </button>

        {expanded && (
          <div id="review-item-list" className="border-t border-border">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                      Listing
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">
                      Flags
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item) => (
                    <ItemRow key={item.id} item={item} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Item row
// ---------------------------------------------------------------------------

function ItemRow({ item }: { item: FeedImportReviewItem }) {
  const hasErrors = item.validation_errors.length > 0;
  const missingMedia = (item.listing.media ?? []).length === 0;
  const missingCoords =
    item.listing.latitude == null || item.listing.longitude == null;

  return (
    <tr className="group bg-card hover:bg-surface transition-colors">
      <td className="px-4 py-3">
        <p className="font-medium text-foreground">{item.listing.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {item.external_id} ·{" "}
          {[item.listing.address_line1, item.listing.city, item.listing.postcode]
            .filter(Boolean)
            .join(", ")}{" "}
          · £{item.listing.price.toLocaleString("en-GB")}
        </p>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={item.status} />
      </td>
      <td className="px-4 py-3">
        {hasErrors ? (
          <ul className="space-y-1">
            {item.validation_errors.map((err) => (
              <li key={err} className="text-xs text-destructive">
                {err}
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {missingMedia && (
              <span
                className="inline-flex items-center gap-1 rounded text-xs text-amber-700 dark:text-amber-400"
                title="No photos"
              >
                <ImageOff className="size-3" aria-hidden />
                No photos
              </span>
            )}
            {missingCoords && (
              <span
                className="inline-flex items-center gap-1 rounded text-xs text-amber-700 dark:text-amber-400"
                title="No map coordinates"
              >
                <MapPin className="size-3" aria-hidden />
                No coords
              </span>
            )}
            {!missingMedia && !missingCoords && (
              <span className="text-xs font-medium text-green-700 dark:text-green-400">
                Ready
              </span>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}

const STATUS_BADGE_MAP: Record<ItemStatus, { variant: "default" | "outline" | "destructive" | "secondary"; label: string }> = {
  approved: { variant: "default", label: "Approved" },
  eligible: { variant: "secondary", label: "Eligible" },
  error: { variant: "destructive", label: "Error" },
  withdrawn: { variant: "outline", label: "Withdrawn" },
};

function StatusBadge({ status }: { status: ItemStatus }) {
  const cfg = STATUS_BADGE_MAP[status] ?? { variant: "outline" as const, label: (status as string).replace(/_/g, " ") };
  return (
    <Badge variant={cfg.variant} className="capitalize">
      {cfg.label}
    </Badge>
  );
}
