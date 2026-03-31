"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import InboxList from "@/components/messaging/InboxList";
import MessageThread from "@/components/messaging/MessageThread";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export default function InboxPageClient() {
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [activeRecipientId, setActiveRecipientId] = useState<string | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`inbox:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `participant_1_id=eq.${user.id}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["inbox"] });
          void queryClient.invalidateQueries({ queryKey: ["unread-count"] });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `participant_2_id=eq.${user.id}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["inbox"] });
          void queryClient.invalidateQueries({ queryKey: ["unread-count"] });
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      void channel.unsubscribe();
      channelRef.current = null;
    };
  }, [user?.id, queryClient]);

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden ring-1 ring-neutral-200/60 dark:ring-neutral-700/60 rounded-xl">
      {/* Conversation list - hidden on mobile when a thread is selected */}
      <div
        className={cn(
          "w-full max-w-xs border-r border-neutral-100/60 dark:border-neutral-700/60 bg-card flex-shrink-0",
          activeConversation ? "hidden md:flex md:flex-col" : "flex flex-col",
        )}
      >
        <InboxList
          activeId={activeConversation ?? undefined}
          onSelectConversation={(id, recipientId) => {
            setActiveConversation(id);
            setActiveRecipientId(recipientId);
          }}
        />
      </div>

      {/* Message thread - hidden on mobile when no thread is selected */}
      <div
        className={cn(
          "flex-1 min-w-0",
          activeConversation ? "flex flex-col" : "hidden md:flex md:flex-col",
        )}
      >
        {activeConversation ? (
          <MessageThread conversationId={activeConversation} recipientId={activeRecipientId ?? ""} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="rounded-full bg-muted p-4 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="size-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
              </svg>
            </div>
            <p className="font-heading text-base font-semibold text-foreground">No conversation selected</p>
            <p className="mt-1 font-body text-sm text-neutral-500">
              Select a conversation to start messaging
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
