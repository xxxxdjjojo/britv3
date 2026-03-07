"use client";

/**
 * Client-side hooks for saved searches with mutations.
 * Uses @tanstack/react-query for data fetching.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SavedSearch } from "@/types/property";
import type { SearchFilters } from "@/types/search";
import { useSearchParams } from "./useSearch";

const QUERY_KEY = ["saved-searches"];

/**
 * Fetch the user's saved searches list.
 */
export function useSavedSearches() {
  return useQuery<SavedSearch[]>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const response = await fetch("/api/saved/searches");
      if (!response.ok) {
        throw new Error(`Failed to fetch saved searches: ${response.status}`);
      }
      return response.json();
    },
  });
}

/**
 * Mutation to save the current search filters.
 */
export function useSaveSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      filters,
      alerts_enabled,
      alert_frequency,
    }: {
      name: string;
      filters: SearchFilters;
      alerts_enabled?: boolean;
      alert_frequency?: "instant" | "daily" | "weekly";
    }) => {
      const response = await fetch("/api/saved/searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, filters, alerts_enabled, alert_frequency }),
      });
      if (!response.ok) {
        throw new Error(`Failed to save search: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

/**
 * Mutation to delete a saved search.
 */
export function useDeleteSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ searchId }: { searchId: string }) => {
      const response = await fetch("/api/saved/searches", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ search_id: searchId }),
      });
      if (!response.ok && response.status !== 204) {
        throw new Error(`Failed to delete search: ${response.status}`);
      }
    },
    onMutate: async ({ searchId }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<SavedSearch[]>(QUERY_KEY);
      queryClient.setQueryData<SavedSearch[]>(QUERY_KEY, (old) =>
        (old ?? []).filter((s) => s.id !== searchId),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

/**
 * Returns a callback that loads a saved search's filters into URL params.
 * Uses nuqs setQueryStates to update the search URL state.
 */
export function useLoadSearch() {
  const [, setParams] = useSearchParams();

  return (savedSearch: SavedSearch) => {
    const filters = savedSearch.filters;
    setParams({
      listing_type: filters.listing_type ?? null,
      min_price: filters.min_price ?? null,
      max_price: filters.max_price ?? null,
      min_bedrooms: filters.min_bedrooms ?? null,
      max_bedrooms: filters.max_bedrooms ?? null,
      min_bathrooms: filters.min_bathrooms ?? null,
      property_type: filters.property_type ?? null,
      epc_rating: filters.epc_rating ?? null,
      new_build: filters.new_build ?? null,
      q: null,
      lat: null,
      lng: null,
      radius: null,
      postcode: null,
      sort: null,
      per_page: null,
    });
  };
}
