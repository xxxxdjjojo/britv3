"use client";

import { useState, useCallback } from "react";
import { ThumbsUp, ThumbsDown, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/reviews/RatingStars";
import { cn } from "@/lib/utils";
import type { Review } from "@/types/marketplace";

type ReviewsListProps = Readonly<{
  reviews: Review[];
  totalCount: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onSortChange?: (sort: "recent" | "helpful") => void;
  onHelpful?: (reviewId: string, isHelpful: boolean) => void;
  onFlag?: (reviewId: string) => void;
  currentPage?: number;
  sort?: "recent" | "helpful";
  className?: string;
}>;

function ReviewItem({
  review,
  onHelpful,
  onFlag,
}: Readonly<{
  review: Review;
  onHelpful?: (reviewId: string, isHelpful: boolean) => void;
  onFlag?: (reviewId: string) => void;
}>) {
  const [expanded, setExpanded] = useState(false);
  const dateStr = new Date(review.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="border-b border-border py-4 last:border-0">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <RatingStars rating={review.overall_rating} size="sm" />
          <h4 className="font-medium text-foreground">{review.title}</h4>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {dateStr}
        </span>
      </div>

      <div className="mt-2">
        <p
          className={cn(
            "text-sm text-muted-foreground",
            !expanded && "line-clamp-3",
          )}
        >
          {review.review_text}
        </p>
        {review.review_text.length > 200 && !expanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="mt-1 text-xs font-medium text-brand-primary hover:underline"
          >
            Read more
          </button>
        )}
      </div>

      {review.provider_response && (
        <div className="mt-3 rounded-md bg-muted/50 p-3">
          <p className="text-xs font-medium text-foreground">
            Provider response
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {review.provider_response}
          </p>
        </div>
      )}

      <div className="mt-3 flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onHelpful?.(review.id, true)}
            aria-label="Mark as helpful"
          >
            <ThumbsUp />
          </Button>
          <span className="text-xs text-muted-foreground">
            {review.helpful_count}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onHelpful?.(review.id, false)}
            aria-label="Mark as not helpful"
          >
            <ThumbsDown />
          </Button>
          <span className="text-xs text-muted-foreground">
            {review.not_helpful_count}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => onFlag?.(review.id)}
          aria-label="Flag review"
          className="ml-auto"
        >
          <Flag />
        </Button>
      </div>
    </div>
  );
}

export function ReviewsList({
  reviews,
  totalCount,
  pageSize = 10,
  onPageChange,
  onSortChange,
  onHelpful,
  onFlag,
  currentPage = 1,
  sort = "recent",
  className,
}: ReviewsListProps) {
  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSortChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onSortChange?.(e.target.value as "recent" | "helpful");
    },
    [onSortChange],
  );

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">
          {totalCount} {totalCount === 1 ? "review" : "reviews"}
        </h3>
        <select
          value={sort}
          onChange={handleSortChange}
          className="rounded-md border border-input bg-transparent px-2 py-1 text-xs text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
        >
          <option value="recent">Most recent</option>
          <option value="helpful">Most helpful</option>
        </select>
      </div>

      <div>
        {reviews.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No reviews yet.
          </p>
        ) : (
          reviews.map((review) => (
            <ReviewItem
              key={review.id}
              review={review}
              onHelpful={onHelpful}
              onFlag={onFlag}
            />
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => onPageChange?.(currentPage - 1)}
          >
            Previous
          </Button>
          <span className="px-3 text-sm text-muted-foreground">
            {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange?.(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
