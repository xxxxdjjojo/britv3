"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Subscribe to real-time viewing updates for a user.
 * Invalidates viewing and dashboard queries and shows a toast on updates.
 */
export function useViewingRealtime(userId: string | undefined) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`viewing-updates:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "viewings",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["viewings"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          toast.info("Viewing update", {
            description: "One of your viewings has been updated.",
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
