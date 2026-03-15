"use client";

/**
 * Hooks for buyer offers — list, submit, withdraw.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { BuyerOffer } from "@/services/offers/offers-service";

const QUERY_KEY = ["offers"];
const STALE_TIME_MS = 60_000; // 1 minute

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

export function useOffers() {
  return useQuery<BuyerOffer[]>({
    queryKey: QUERY_KEY,
    staleTime: STALE_TIME_MS,
    queryFn: async () => {
      const response = await fetch("/api/offers");
      if (!response.ok) {
        throw new Error(`Failed to fetch offers: ${response.status}`);
      }
      return response.json();
    },
  });
}

// ---------------------------------------------------------------------------
// Submit
// ---------------------------------------------------------------------------

export type SubmitOfferVars = {
  listingId: string;
  amountGBP: number;
  agentId: string;
  aipDocumentId?: string;
};

export function useSubmitOffer() {
  const queryClient = useQueryClient();

  return useMutation<{ offerId: string }, Error, SubmitOfferVars>({
    mutationFn: async (vars) => {
      const response = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vars),
      });

      const data = await response.json();

      if (!response.ok) {
        throw Object.assign(new Error(data.error ?? "Failed to submit offer"), {
          code: data.error,
        });
      }

      // TODO: posthog.capture("offer.submitted", { offerId: data.offerId })

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

// ---------------------------------------------------------------------------
// Withdraw
// ---------------------------------------------------------------------------

export function useWithdrawOffer() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { offerId: string }>({
    mutationFn: async ({ offerId }) => {
      const response = await fetch("/api/offers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to withdraw offer");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
