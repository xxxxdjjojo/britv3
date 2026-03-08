"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useDeleteSearch } from "@/hooks/useSavedSearches";
import type { SavedSearch } from "@/types/property";
import { Search, Trash2 } from "lucide-react";

function buildSearchUrl(filters: SavedSearch["filters"]): string {
  const params = new URLSearchParams();

  if (filters.listing_type) params.set("listing_type", filters.listing_type);
  if (filters.min_price) params.set("min_price", String(filters.min_price));
  if (filters.max_price) params.set("max_price", String(filters.max_price));
  if (filters.min_bedrooms) params.set("min_bedrooms", String(filters.min_bedrooms));
  if (filters.max_bedrooms) params.set("max_bedrooms", String(filters.max_bedrooms));
  if (filters.min_bathrooms) params.set("min_bathrooms", String(filters.min_bathrooms));
  if (filters.property_type && filters.property_type.length > 0) {
    params.set("property_type", filters.property_type.join(","));
  }
  if (filters.epc_rating) params.set("epc_rating", filters.epc_rating);
  if (filters.new_build != null) params.set("new_build", String(filters.new_build));

  return `/search?${params.toString()}`;
}

export function SavedSearchActions(
  props: Readonly<{ search: SavedSearch }>,
) {
  const router = useRouter();
  const deleteSearch = useDeleteSearch();

  return (
    <div className="flex shrink-0 gap-2">
      <Button
        variant="outline"
        size="sm"
        className="gap-1"
        onClick={() => router.push(buildSearchUrl(props.search.filters))}
      >
        <Search className="size-3" />
        Run
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="gap-1 text-red-600 hover:bg-red-50 hover:text-red-700"
        onClick={() => deleteSearch.mutate({ searchId: props.search.id })}
        disabled={deleteSearch.isPending}
      >
        <Trash2 className="size-3" />
        Delete
      </Button>
    </div>
  );
}
