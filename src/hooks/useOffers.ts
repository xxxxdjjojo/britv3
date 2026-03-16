"use client";

/**
 * Client-side hooks for offers (buyer perspective) using @tanstack/react-query.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Offer } from "@/services/offers/offers-service";

export const OFFERS_QUERY_KEY = ["offers"];

/**
 * Fetch the authenticated user's submitted offers.
 */
export function useMyOffers() {
  return useQuery<Offer[]>({
    queryKey: OFFERS_QUERY_KEY,
    queryFn: async () => {
      const response = await fetch("/api/offers");
      if (!response.ok) {
        throw new Error(`Failed to fetch offers: ${response.status}`);
      }
      return response.json();
    },
    staleTime: 60_000,
  });
}

/**
 * Mutation to submit a new offer.
 * Shows success toast or a duplicate-offer error toast.
 */
export function useSubmitOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listingId,
      agentId,
      amountGBP,
      conditions,
    }: {
      listingId: string;
      agentId: string;
      amountGBP: number;
      conditions?: string;
    }) => {
      const response = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: listingId,
          agent_id: agentId,
          amount_gbp: amountGBP,
          conditions,
        }),
      });

      const data = (await response.json()) as { error?: string } & Partial<Offer>;

      if (!response.ok) {
        throw Object.assign(new Error(data.error ?? "Failed to submit offer"), {
          status: response.status,
        });
      }

      return data as Offer;
    },
    onSuccess: () => {
      toast.success("Offer submitted");
      queryClient.invalidateQueries({ queryKey: OFFERS_QUERY_KEY });
    },
    onError: (error: Error & { status?: number }) => {
      if (error.status === 409) {
        toast.error("You already have an active offer on this property");
      } else {
        toast.error(error.message || "Failed to submit offer");
      }
    },
  });
}
