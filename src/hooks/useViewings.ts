"use client";

/**
 * Hooks for buyer viewings — list, book, cancel, reschedule.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trackEvent } from "@/lib/analytics/track-event";
import type { Viewing } from "@/services/viewings/viewings-service";

const QUERY_KEY = ["viewings"];
const STALE_TIME_MS = 60_000; // 1 minute

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

export function useViewings() {
  return useQuery<Viewing[]>({
    queryKey: QUERY_KEY,
    staleTime: STALE_TIME_MS,
    queryFn: async () => {
      const response = await fetch("/api/viewings");
      if (!response.ok) {
        throw new Error(`Failed to fetch viewings: ${response.status}`);
      }
      return response.json();
    },
  });
}

// ---------------------------------------------------------------------------
// Book
// ---------------------------------------------------------------------------

export type BookViewingVars = {
  viewingSlotId: string;
  listingId: string;
  type: "in_person" | "virtual";
};

export function useBookViewing() {
  const queryClient = useQueryClient();

  return useMutation<{ viewingId: string }, Error, BookViewingVars>({
    mutationFn: async (vars) => {
      const response = await fetch("/api/viewings/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vars),
      });

      const data = await response.json();

      if (!response.ok) {
        throw Object.assign(new Error(data.error ?? "Failed to book viewing"), {
          code: data.error,
        });
      }

      trackEvent("viewing.booked", { viewingId: data.viewingId });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

// ---------------------------------------------------------------------------
// Cancel
// ---------------------------------------------------------------------------

export function useCancelViewing() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { viewingId: string }>({
    mutationFn: async ({ viewingId }) => {
      const response = await fetch(`/api/viewings/${viewingId}`, {
        method: "DELETE",
      });

      if (!response.ok && response.status !== 204) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to cancel viewing");
      }

      trackEvent("viewing.cancelled", { viewingId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

// ---------------------------------------------------------------------------
// Reschedule
// ---------------------------------------------------------------------------

export function useRescheduleViewing() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { viewingId: string; newSlotId: string }>({
    mutationFn: async ({ viewingId, newSlotId }) => {
      const response = await fetch(`/api/viewings/${viewingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newSlotId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw Object.assign(new Error(data.error ?? "Failed to reschedule viewing"), {
          code: data.error,
        });
      }

      trackEvent("viewing.rescheduled", { viewingId, newSlotId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
