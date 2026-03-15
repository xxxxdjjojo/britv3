"use client";

/**
 * Message thread hooks -- infinite query for cursor pagination, send mutation, mark-as-read.
 */

import { useEffect } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type { Message } from "@/types/messaging";

type MessagesPage = {
  messages: Message[];
};

/**
 * Fetch messages in a conversation with cursor-based pagination.
 */
export function useMessages(conversationId: string) {
  return useInfiniteQuery<MessagesPage>({
    queryKey: ["messages", conversationId],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (pageParam) {
        params.set("cursor", pageParam as string);
      }

      const qs = params.toString();
      const url = `/api/messages/${conversationId}${qs ? `?${qs}` : ""}`;
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error("Failed to load messages");
      }

      return res.json();
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      const messages = lastPage.messages;
      if (!messages || messages.length === 0) return undefined;
      // Cursor is the created_at of the oldest message in the page
      const oldest = messages[messages.length - 1];
      return oldest?.created_at ? String(oldest.created_at) : undefined;
    },
  });
}

/**
 * Send a message to a conversation.
 * Invalidates inbox and message queries on success.
 */
export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      content: string;
      recipient_id: string;
      context_type?: string;
      message_id?: string;
      attachment_url?: string;
      attachment_type?: string;
      attachment_size_bytes?: number;
    }) => {
      const res = await fetch(`/api/messages/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to send message");
      }

      return res.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["messages", conversationId],
      });
      void queryClient.invalidateQueries({ queryKey: ["inbox"] });
      void queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to send message");
    },
  });
}

/**
 * Mark a conversation as read on mount.
 */
export function useMarkAsRead(conversationId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/messages/${conversationId}/read`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Failed to mark as read");
      }

      return res.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["inbox"] });
      void queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });

  // Fire on mount
  useEffect(() => {
    mutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  return mutation;
}
