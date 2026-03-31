"use client";

/**
 * Buyer Dashboard — Messages Inbox
 * Two-pane layout: conversation list (left) + message thread (right).
 * Styled to match Stitch buyer-messages design.
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
import { ArrowLeft, Mail } from "lucide-react";

// ---------------------------------------------------------------------------
// Unread count badge
// ---------------------------------------------------------------------------

function UnreadBadge() {
  const { data } = useInbox({});
  const unreadCount =
    data?.conversations.reduce(
      (sum, c) => sum + (c.unread_count ?? 0),
      0,
    ) ?? 0;

  if (unreadCount === 0) return null;

  return (
    <span className="ml-2 rounded-full bg-[#003629] px-2 py-0.5 text-xs font-medium text-white">
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Empty thread placeholder
// ---------------------------------------------------------------------------

function NoConversationSelected() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-[#f4f3f2]">
        <Mail className="size-8 text-zinc-400" strokeWidth={1.25} />
      </div>
      <div>
        <p className="font-['Plus_Jakarta_Sans'] font-bold text-[#1a1c1c]">
          Select a conversation
        </p>
        <p className="mt-1 text-sm text-zinc-500 font-['Inter']">
          Choose from the list on the left to start messaging
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MessagesPage() {
  const [activeConversation, setActiveConversation] = useState<string | null>(
    null,
  );
  const [activeRecipientId, setActiveRecipientId] = useState<string | null>(
    null,
  );
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Realtime subscription — invalidates inbox on any conversation change
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
    <div className="min-h-screen bg-[#faf9f8] text-[#1a1c1c] flex flex-col gap-6">
      {/* ── Page header ────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-tight text-[#1a1c1c] flex items-center">
            Messages
            <UnreadBadge />
          </h1>
          <p className="text-sm text-zinc-500 font-['Inter'] mt-0.5">
            Your conversations with agents and sellers
          </p>
        </div>
      </div>

      {/* ── Two-pane messaging panel ───────────────────────────── */}
      <div className="overflow-hidden rounded-2xl bg-[#faf9f8] shadow-[0_4px_24px_rgba(26,28,28,0.06)]">
        <div className="flex h-[calc(100vh-16rem)] min-h-[400px]">
          {/* ── Left pane: conversation list ────────────────── */}
          <div
            className={cn(
              "bg-[#f4f3f2] flex flex-col",
              "w-full sm:w-96 sm:flex-shrink-0",
              activeConversation
                ? "hidden sm:flex"
                : "flex",
            )}
          >
            {/* Pane header */}
            <div className="px-5 pt-6 pb-3">
              <p className="font-['Plus_Jakarta_Sans'] font-bold text-xl text-[#1a1c1c] mb-5">
                Messages
              </p>
            </div>

            {/* InboxList fills remaining height */}
            <div className="flex-1 overflow-hidden">
              <InboxList
                activeId={activeConversation ?? undefined}
                onSelectConversation={(id, recipientId) => {
                  setActiveConversation(id);
                  setActiveRecipientId(recipientId);
                }}
              />
            </div>
          </div>

          {/* ── Right pane: message thread ──────────────────── */}
          <div
            className={cn(
              "flex-1 min-w-0 bg-[#faf9f8]",
              activeConversation
                ? "flex flex-col"
                : "hidden sm:flex sm:flex-col",
            )}
          >
            {activeConversation ? (
              <div className="flex h-full flex-col">
                {/* Mobile back button */}
                <div className="flex items-center gap-2 border-b border-[#eeeeed] px-4 py-3 sm:hidden bg-white/80 backdrop-blur-sm">
                  <button
                    onClick={() => setActiveConversation(null)}
                    className="flex items-center gap-1.5 text-sm text-zinc-600 hover:text-[#003629] transition-colors"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="size-4" strokeWidth={1.25} />
                    Back
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <MessageThread
                    conversationId={activeConversation}
                    recipientId={activeRecipientId ?? ""}
                  />
                </div>
              </div>
            ) : (
              <NoConversationSelected />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
