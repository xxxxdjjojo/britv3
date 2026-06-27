"use client";

/**
 * Inbox hooks -- conversation list with 30s polling and unread count.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Conversation, ContextType, Folder } from "@/types/messaging";
import { filterByFolder, folderCounts } from "@/lib/messaging/folders";

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

/**
 * Inbox with Gmail-style folders. Fetches ALL conversations once (no per-folder
 * server round-trips); folder filtering and counts are derived client-side.
 */
export function useInboxFolders(filters?: InboxFilters) {
  const { data, isLoading, error } = useInbox(filters);
  const conversations = data?.conversations ?? [];

  return {
    conversations,
    counts: folderCounts(conversations),
    filterByFolder: (folder: Folder) => filterByFolder(conversations, folder),
    isLoading,
    error,
  };
}

/**
 * Draft hook for a conversation. Seeds from the saved draft (deep links) and
 * exposes save/clear mutations. The composer owns debounce timing (Task 5).
 */
export function useDraft(conversationId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery<{ draft: string | null }>({
    queryKey: ["draft", conversationId],
    queryFn: async () => {
      const res = await fetch(`/api/messages/${conversationId}/draft`);
      if (!res.ok) {
        throw new Error("Failed to load draft");
      }
      return res.json();
    },
    enabled: Boolean(conversationId),
    staleTime: Infinity,
  });

  const saveMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch(`/api/messages/${conversationId}/draft`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        throw new Error("Failed to save draft");
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["inbox"] });
    },
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/messages/${conversationId}/draft`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to clear draft");
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["inbox"] });
    },
  });

  return {
    draft: query.data?.draft ?? null,
    isLoading: query.isLoading,
    /** True when the most recent draft save failed (text is never lost on screen). */
    saveFailed: saveMutation.isError,
    save: (text: string) => saveMutation.mutate(text),
    clear: () => clearMutation.mutate(),
  };
}

/**
 * Archive (or un-archive) a conversation; refreshes inbox + unread badge.
 */
export function useArchiveConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: { conversationId: string; archived: boolean }) => {
      const res = await fetch(`/api/messages/${vars.conversationId}/archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: vars.archived }),
      });
      if (!res.ok) {
        throw new Error("Failed to archive conversation");
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["inbox"] });
      void queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });
}

/**
 * Block (or unblock) a conversation; refreshes inbox + unread badge.
 */
export function useBlockConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: { conversationId: string; blocked: boolean }) => {
      const res = await fetch(`/api/messages/${vars.conversationId}/block`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocked: vars.blocked }),
      });
      if (!res.ok) {
        throw new Error("Failed to update block status");
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["inbox"] });
      void queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });
}
