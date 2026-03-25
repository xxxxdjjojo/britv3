"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { BuyerOffer } from "@/services/offers/offers-service";

/**
 * Subscribe to real-time offer status changes for a user.
 * Filters client-side since offer_status_history lacks a user_id column.
 * Invalidates offer and dashboard queries and shows a toast on updates.
 */
export function useOfferRealtime(userId: string | undefined) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`offer-updates:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "offer_status_history",
        },
        (payload) => {
          // Client-side filter: only act if the offer belongs to this user
          const offerId = payload.new?.offer_id as string | undefined;
          const cachedOffers = queryClient.getQueryData<BuyerOffer[]>(["offers"]);
          const isOwnOffer = cachedOffers?.some((o) => o.id === offerId);
          if (!isOwnOffer) return;

          const newStatus = payload.new?.to_status as string | undefined;
          queryClient.invalidateQueries({ queryKey: ["offers"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          toast.info("Offer update", {
            description: newStatus
              ? `Your offer status changed to: ${newStatus.replace(/_/g, " ")}`
              : "Your offer status has been updated.",
          });
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [userId, queryClient]);
}
