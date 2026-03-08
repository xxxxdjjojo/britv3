"use client";

/**
 * Inbox hooks -- conversation list with 30s polling and unread count.
 */

import { useQuery } from "@tanstack/react-query";
import type { Conversation, ContextType } from "@/types/messaging";

type InboxFilters = {
  context_type?: ContextType;
  search?: string;
};

type InboxResponse = {
  conversations: Conversation[];
};

type UnreadResponse = {
  count: number;
};

/**
 * Fetch inbox conversations with 30-second polling refresh.
 */
export function useInbox(filters?: InboxFilters) {
  return useQuery<InboxResponse>({
    queryKey: ["inbox", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.context_type) {
        params.set("context_type", filters.context_type);
      }
      if (filters?.search) {
        params.set("search", filters.search);
      }

      const qs = params.toString();
      const url = `/api/messages${qs ? `?${qs}` : ""}`;
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error("Failed to load inbox");
      }

      return res.json();
    },
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    staleTime: 10_000,
  });
}

/**
 * Fetch unread conversation count with 30-second polling.
 */
export function useUnreadCount() {
  return useQuery<UnreadResponse>({
    queryKey: ["unread-count"],
    queryFn: async () => {
      const res = await fetch("/api/messages?count_only=true");
      if (!res.ok) {
        throw new Error("Failed to load unread count");
      }
      return res.json();
    },
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    staleTime: 10_000,
  });
}
