"use client";

/**
 * Client-side hooks for saved properties (shortlist) with optimistic updates.
 * Uses @tanstack/react-query for data fetching and mutations.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { SavedPropertyWithDetails } from "@/services/saved/saved-properties-service";

const QUERY_KEY = ["saved-properties"];

/**
 * Fetch the user's saved properties list.
 */
export function useSavedProperties() {
  return useQuery<SavedPropertyWithDetails[]>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const response = await fetch("/api/saved/properties");
      if (!response.ok) {
        throw new Error(`Failed to fetch saved properties: ${response.status}`);
      }
      return response.json();
    },
  });
}

/**
 * Mutation to save a property with optimistic update.
 * Immediately adds the property to the cached list; rolls back on error.
 */
export function useSaveProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listingId, notes }: { listingId: string; notes?: string }) => {
      const response = await fetch("/api/saved/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: listingId, notes }),
      });
      if (!response.ok) {
        throw new Error(`Failed to save property: ${response.status}`);
      }
      return response.json();
    },
    onMutate: async ({ listingId }) => {
      // Cancel outgoing fetches
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });

      // Snapshot previous value for rollback
      const previous = queryClient.getQueryData<SavedPropertyWithDetails[]>(QUERY_KEY);

      // Optimistically add the item
      queryClient.setQueryData<SavedPropertyWithDetails[]>(QUERY_KEY, (old) => [
        {
          id: `optimistic-${listingId}`,
          user_id: "",
          listing_id: listingId,
          notes: null,
          created_at: new Date().toISOString(),
          listing: {} as SavedPropertyWithDetails["listing"],
          property: {} as SavedPropertyWithDetails["property"],
        },
        ...(old ?? []),
      ]);

      return { previous };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      // Refetch to get real data
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

/**
 * Mutation to unsave a property with optimistic removal.
 */
export function useUnsaveProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listingId }: { listingId: string }) => {
      const response = await fetch("/api/saved/properties", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: listingId }),
      });
      if (!response.ok && response.status !== 204) {
        throw new Error(`Failed to unsave property: ${response.status}`);
      }
    },
    onMutate: async ({ listingId }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });

      const previous = queryClient.getQueryData<SavedPropertyWithDetails[]>(QUERY_KEY);

      // Optimistically remove the item
      queryClient.setQueryData<SavedPropertyWithDetails[]>(QUERY_KEY, (old) =>
        (old ?? []).filter((item) => item.listing_id !== listingId),
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
 * Check if a specific listing is in the user's saved list.
 * Reads from the cached saved properties list (no extra API call).
 */
export function useIsPropertySaved(listingId: string): boolean {
  const { data: savedProperties } = useSavedProperties();

  return useCallback(() => {
    if (!savedProperties) return false;
    return savedProperties.some((item) => item.listing_id === listingId);
  }, [savedProperties, listingId])();
}
