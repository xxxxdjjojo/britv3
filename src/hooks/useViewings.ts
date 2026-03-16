"use client";

/**
 * Client-side hooks for viewings using @tanstack/react-query.
 * Covers listing, booking, cancelling, and rescheduling viewings.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ViewingWithDetails } from "@/services/viewings/viewings-service";

export const VIEWINGS_QUERY_KEY = ["viewings"];

/**
 * Fetch the user's viewings list.
 */
export function useViewings() {
  return useQuery<ViewingWithDetails[]>({
    queryKey: VIEWINGS_QUERY_KEY,
    queryFn: async () => {
      const response = await fetch("/api/viewings");
      if (!response.ok) {
        throw new Error(`Failed to fetch viewings: ${response.status}`);
      }
      return response.json();
    },
    staleTime: 60_000,
  });
}

/**
 * Mutation to book a viewing slot.
 * Shows a success toast or a slot-unavailable error toast.
 */
export function useBookViewing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      slotId,
      listingId,
      type,
    }: {
      slotId: string;
      listingId: string;
      type: "in_person" | "virtual";
    }) => {
      const response = await fetch("/api/viewings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slot_id: slotId,
          listing_id: listingId,
          type,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        success?: boolean;
        viewingId?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? `Failed to book viewing: ${response.status}`);
      }

      return data;
    },
    onSuccess: () => {
      toast.success("Viewing booked");
      queryClient.invalidateQueries({ queryKey: VIEWINGS_QUERY_KEY });
    },
    onError: (error: Error) => {
      if (error.message.includes("SLOT_UNAVAILABLE")) {
        toast.error("Slot no longer available");
      } else {
        toast.error(error.message || "Failed to book viewing");
      }
    },
  });
}

/**
 * Mutation to cancel a viewing by ID.
 */
export function useCancelViewing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ viewingId }: { viewingId: string }) => {
      const response = await fetch(`/api/viewings/${viewingId}`, {
        method: "DELETE",
      });

      if (!response.ok && response.status !== 204) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? `Failed to cancel viewing: ${response.status}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VIEWINGS_QUERY_KEY });
    },
  });
}

/**
 * Mutation to reschedule a viewing to a new slot.
 */
export function useRescheduleViewing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      viewingId,
      newSlotId,
    }: {
      viewingId: string;
      newSlotId: string;
    }) => {
      const response = await fetch(`/api/viewings/${viewingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_slot_id: newSlotId }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? `Failed to reschedule viewing: ${response.status}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VIEWINGS_QUERY_KEY });
    },
  });
}
