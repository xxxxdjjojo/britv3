"use client";

/**
 * Supabase Realtime subscription hook for dashboard updates.
 * Subscribes to a single channel per user to minimize connection count.
 */

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Subscribe to real-time dashboard updates for a user.
 * Listens for changes on conversations and platform_events tables.
 * Calls onUpdate when changes are detected (typically to invalidate dashboard query).
 *
 * @param userId - The user ID to subscribe updates for
 * @param onUpdate - Callback fired when relevant data changes
 */
export function useRealtimeSubscription(
  userId: string | undefined,
  onUpdate: () => void,
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  });

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`dashboard:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `participant_ids=cs.{${userId}}`,
        },
        () => {
          onUpdateRef.current();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "platform_events",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          onUpdateRef.current();
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [userId]);
}
