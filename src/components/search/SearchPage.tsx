"use client";

/**
 * Search page orchestrator -- composes SearchBar, SearchFilters, SearchResults,
 * SearchSortBar, and PropertyMap into a unified search experience.
 */

import { useState, useCallback, useMemo } from "react";
import { useSearchParams, useSearchResults } from "@/hooks/useSearch";
import { SearchBar } from "./SearchBar";
import { SearchFilters } from "./SearchFilters";
import { SearchResults } from "./SearchResults";
import { SearchSortBar } from "./SearchSortBar";
import { PropertyMap } from "@/components/map/PropertyMap";
import type { PropertyMapPoint } from "@/types/map";
import type { SearchListingRow } from "@/types/property";

type ViewMode = "list" | "map" | "split";

function listingToMapPoint(row: SearchListingRow): PropertyMapPoint | null {
  if (!row.coordinates) return null;
  return {
    id: row.listing_id,
    lat: row.coordinates.lat,
    lng: row.coordinates.lng,
    price: row.price,
    property_type: row.property_type,
    bedrooms: row.bedrooms,
    listing_type: row.listing_type,
  };
}

export function SearchPage() {
  const [params] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const searchResults = useSearchResults(params);

  const pages = searchResults.data?.pages;
  const allListings = useMemo(() => {
    if (!pages) return [];
    return pages.flatMap((page) => page.data);
  }, [pages]);

  const totalCount = searchResults.data?.pages[0]?.count ?? 0;

  const mapPoints = useMemo(() => {
    return allListings
      .map(listingToMapPoint)
      .filter((p): p is PropertyMapPoint => p !== null);
  }, [allListings]);

  const handlePropertyClick = useCallback((id: string) => {
    const listing = allListings.find((l) => l.listing_id === id);
    if (listing?.slug) {
      window.location.href = `/properties/${listing.slug}`;
    }
  }, [allListings]);

  const handleLoadMore = useCallback(() => {
    if (searchResults.hasNextPage && !searchResults.isFetchingNextPage) {
      searchResults.fetchNextPage();
    }
  }, [searchResults]);

  // Count active filters for mobile badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (params.property_type && params.property_type.length > 0) count++;
    if (params.min_price) count++;
    if (params.max_price) count++;
    if (params.min_bedrooms) count++;
    if (params.min_bathrooms) count++;
    if (params.epc_rating) count++;
    if (params.new_build) count++;
    return count;
  }, [params]);

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col">
      {/* Search bar */}
      <div className="border-b bg-background px-4 py-3">
        <SearchBar />
      </div>

      {/* Sort bar + view toggle */}
      <SearchSortBar
        totalCount={totalCount}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        activeFilterCount={activeFilterCount}
        onFiltersToggle={() => setFiltersOpen(!filtersOpen)}
      />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Filters sidebar -- desktop */}
        <div className="hidden lg:block">
          <SearchFilters
            open={filtersOpen}
            onOpenChange={setFiltersOpen}
            isMobile={false}
          />
        </div>

        {/* Filters sheet -- mobile */}
        <div className="lg:hidden">
          <SearchFilters
            open={filtersOpen}
            onOpenChange={setFiltersOpen}
            isMobile={true}
            resultCount={totalCount || undefined}
          />
        </div>

        {/* Results / Map / Split */}
        {viewMode === "list" && (
          <div className="flex-1 overflow-y-auto p-4">
            <SearchResults
              listings={allListings}
              isLoading={searchResults.isLoading}
              hasNextPage={!!searchResults.hasNextPage}
              isFetchingNextPage={searchResults.isFetchingNextPage}
              onLoadMore={handleLoadMore}
              layout="grid"
            />
          </div>
        )}

        {viewMode === "map" && (
          <div className="flex-1">
            <PropertyMap
              properties={mapPoints}
              onPropertyClick={handlePropertyClick}
              cooperativeGestures={false}
            />
          </div>
        )}

        {viewMode === "split" && (
          <div className="flex flex-1">
            <div className="w-1/2 overflow-y-auto border-r p-4">
              <SearchResults
                listings={allListings}
                isLoading={searchResults.isLoading}
                hasNextPage={!!searchResults.hasNextPage}
                isFetchingNextPage={searchResults.isFetchingNextPage}
                onLoadMore={handleLoadMore}
                layout="single"
              />
            </div>
            <div className="w-1/2">
              <PropertyMap
                properties={mapPoints}
                onPropertyClick={handlePropertyClick}
                cooperativeGestures={false}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
