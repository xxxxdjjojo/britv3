"use client";

import { useCallback } from "react";
import { ReviewCardEnhanced } from "@/components/reviews/ReviewCardEnhanced";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Review } from "@/types/marketplace";

type ReviewsListProps = Readonly<{
  reviews: Review[];
  totalCount: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onSortChange?: (sort: "recent" | "helpful") => void;
  onEdit?: (review: Review) => void;
  currentUserId?: string;
  currentPage?: number;
  sort?: "recent" | "helpful";
  loading?: boolean;
  className?: string;
}>;

function ReviewSkeleton() {
  return (
    <div className="animate-pulse border-b border-border py-5 last:border-0">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="size-4 rounded bg-neutral-200" />
            ))}
          </div>
          <div className="h-4 w-48 rounded bg-neutral-200" />
        </div>
        <div className="h-3 w-20 rounded bg-neutral-200" />
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-3 w-full rounded bg-neutral-200" />
        <div className="h-3 w-3/4 rounded bg-neutral-200" />
      </div>
      <div className="mt-3 flex gap-3">
        <div className="h-7 w-16 rounded bg-neutral-200" />
        <div className="h-7 w-16 rounded bg-neutral-200" />
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
  onEdit,
  currentUserId,
  currentPage = 1,
  sort = "recent",
  loading = false,
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
        {loading ? (
          <>
            <ReviewSkeleton />
            <ReviewSkeleton />
            <ReviewSkeleton />
          </>
        ) : reviews.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No reviews yet.
          </p>
        ) : (
          reviews.map((review) => (
            <ReviewCardEnhanced
              key={review.id}
              review={review}
              currentUserId={currentUserId}
              onEdit={onEdit}
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
