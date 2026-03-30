"use client";

/**
 * Buyer Dashboard — Messages Inbox
 * Embeds the full InboxPageClient inside the dashboard shell with a styled header.
 */

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import InboxList from "@/components/messaging/InboxList";
import MessageThread from "@/components/messaging/MessageThread";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useInbox } from "@/hooks/useInbox";
import { cn } from "@/lib/utils";
import { MessageSquare, ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Unread count badge
// ---------------------------------------------------------------------------

function UnreadIndicator() {
  const { data } = useInbox({});
  const unreadCount = data?.conversations.reduce(
    (sum, c) => sum + (c.unread_count ?? 0),
    0,
  ) ?? 0;

  if (unreadCount === 0) return null;

  return (
    <span className="ml-2 rounded-full bg-brand-primary px-2 py-0.5 text-xs font-medium text-white">
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MessagesPage() {
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [activeRecipientId, setActiveRecipientId] = useState<string | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Realtime subscription — mirrors InboxPageClient logic
  useEffect(() => {
    if (!user?.id) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`dashboard-inbox:${user.id}`)
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
    <div className="flex flex-col gap-4">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-lg bg-brand-primary-lighter">
          <MessageSquare className="size-4 stroke-[1.25] text-brand-primary" />
        </div>
        <div className="flex items-center">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Messages
          </h1>
          <UnreadIndicator />
        </div>
        <p className="ml-auto text-sm text-neutral-500">
          Your conversations with agents and sellers
        </p>
      </div>

      {/* ── Messaging panel ─────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-card shadow-sm">
        <div className="flex h-[calc(100vh-16rem)] min-h-96">
          {/* Conversation list */}
          <div
            className={cn(
              "w-full border-r border-neutral-200 bg-card sm:max-w-xs sm:flex-shrink-0",
              activeConversation
                ? "hidden sm:flex sm:flex-col"
                : "flex flex-col",
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

          {/* Message thread */}
          <div
            className={cn(
              "flex-1 min-w-0",
              activeConversation
                ? "flex flex-col"
                : "hidden sm:flex sm:flex-col",
            )}
          >
            {activeConversation ? (
              <div className="flex h-full flex-col">
                {/* Mobile back button */}
                <div className="flex items-center gap-2 border-b border-neutral-200 px-4 py-2 sm:hidden">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveConversation(null)}
                    className="text-neutral-600"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="mr-1.5 size-4 stroke-[1.25]" />
                    Back
                  </Button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <MessageThread
                    conversationId={activeConversation}
                    recipientId={activeRecipientId ?? ""}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-neutral-100">
                  <Mail className="size-7 stroke-[1.25] text-neutral-400" />
                </div>
                <div>
                  <p className="font-medium text-neutral-900">
                    Select a conversation
                  </p>
                  <p className="mt-1 text-sm text-neutral-500">
                    Choose from the list on the left to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
