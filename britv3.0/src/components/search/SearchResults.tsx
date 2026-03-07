"use client";

/**
 * Search results grid/list with loading skeletons, empty state, and load more.
 */

import { useRef, useEffect } from "react";
import { PropertyCard, PropertyCardSkeleton } from "./PropertyCard";
import { Button } from "@/components/ui/button";
import { SearchXIcon } from "lucide-react";
import type { SearchListingRow } from "@/types/property";

type SearchResultsProps = Readonly<{
  listings: SearchListingRow[];
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  layout: "grid" | "single";
}>;

export function SearchResults({
  listings,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  layout,
}: SearchResultsProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll observer
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          onLoadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  // Loading state
  if (isLoading) {
    return (
      <div
        className={
          layout === "grid"
            ? "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
            : "flex flex-col gap-4"
        }
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <PropertyCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Empty state
  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <SearchXIcon className="size-12 text-muted-foreground" />
        <div>
          <h3 className="text-lg font-medium">No properties found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your filters or searching a different area.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        className={
          layout === "grid"
            ? "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
            : "flex flex-col gap-4"
        }
      >
        {listings.map((listing) => (
          <PropertyCard key={listing.listing_id} listing={listing} />
        ))}
      </div>

      {/* Load more trigger */}
      {hasNextPage && (
        <div className="mt-6 flex justify-center" ref={sentinelRef}>
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}
