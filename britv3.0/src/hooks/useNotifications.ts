"use client";

/**
 * Client-side hooks for notification feed, unread count, and mark-all-read.
 * Uses React Query with 60s polling interval.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PlatformEvent } from "@/types/notifications";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NotificationFeedResponse = Readonly<{
  notifications: PlatformEvent[];
  lastReadAt: string | null;
  nextCursor: string | null;
}>;

type NotificationCountResponse = Readonly<{
  count: number;
}>;

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Fetch the notification feed with 60s polling.
 */
export function useNotifications(cursor?: string) {
  return useQuery<NotificationFeedResponse>({
    queryKey: ["notifications", cursor],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (cursor) params.set("cursor", cursor);
      const res = await fetch(`/api/notifications?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}

/**
 * Fetch unread notification count with 60s polling.
 */
export function useNotificationCount() {
  return useQuery<NotificationCountResponse>({
    queryKey: ["notification-count"],
    queryFn: async () => {
      const res = await fetch("/api/notifications?count_only=true");
      if (!res.ok) throw new Error("Failed to fetch notification count");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}

/**
 * Mark all notifications as read. Invalidates the count query on success.
 */
export function useMarkAllRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications/read", { method: "POST" });
      if (!res.ok) throw new Error("Failed to mark notifications as read");
      return res.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notification-count"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
