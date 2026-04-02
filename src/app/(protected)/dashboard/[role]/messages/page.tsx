"use client";

/**
 * Dashboard Messages — Unified Inbox
 * 3-pane layout: conversation list (left) + message thread (center) + action sidebar (right).
 * Styled to match Stitch "Inbox — All Conversations" design.
 */

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import InboxList from "@/components/messaging/InboxList";
import MessageThread from "@/components/messaging/MessageThread";
import ActionSidebar from "@/components/messaging/ActionSidebar";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useInbox } from "@/hooks/useInbox";
import { cn } from "@/lib/utils";
import { ArrowLeft, Mail } from "lucide-react";
import type { ContextType } from "@/types/messaging";

// ---------------------------------------------------------------------------
// Empty thread placeholder
// ---------------------------------------------------------------------------

function NoConversationSelected() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-surface-container-low">
        <Mail className="size-8 text-outline" strokeWidth={1.25} />
      </div>
      <div>
        <p className="font-heading font-bold text-on-surface">
          Select a conversation
        </p>
        <p className="mt-1 text-sm text-on-surface-variant font-sans">
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

  // Get active conversation metadata for the sidebar
  const { data: inboxData } = useInbox({});
  const activeConvData = inboxData?.conversations.find(
    (c) => c.id === activeConversation,
  );
  const activeCount = inboxData?.conversations.length ?? 0;

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
    <div className="min-h-screen bg-surface text-on-surface flex flex-col gap-4">
      {/* ── Page header ────────────────────────────────────────── */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="font-heading text-lg font-bold tracking-tight text-brand-primary">
            Conversations
          </h1>
          {activeCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold tracking-wider uppercase">
              {activeCount} Active
            </span>
          )}
        </div>
      </header>

      {/* ── Three-pane messaging layout ─────────────────────────── */}
      <div className="overflow-hidden rounded-2xl bg-surface shadow-[0_4px_24px_rgba(26,28,28,0.06)]">
        <div className="flex h-[calc(100vh-12rem)] min-h-[400px]">
          {/* ── Left pane: conversation list ────────────────── */}
          <div
            className={cn(
              "bg-surface-container-low flex flex-col",
              "w-full sm:w-80 sm:flex-shrink-0",
              activeConversation
                ? "hidden sm:flex"
                : "flex",
            )}
            role="navigation"
            aria-label="Conversation list"
          >
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

          {/* ── Center pane: message thread ──────────────────── */}
          <div
            className={cn(
              "flex-1 min-w-0 bg-surface",
              activeConversation
                ? "flex flex-col"
                : "hidden sm:flex sm:flex-col",
            )}
            role="main"
          >
            {activeConversation ? (
              <div className="flex h-full flex-col">
                {/* Mobile back button */}
                <div className="flex items-center gap-2 border-b border-surface-container px-4 py-3 sm:hidden bg-surface-container-lowest/80 backdrop-blur-sm">
                  <button
                    onClick={() => setActiveConversation(null)}
                    className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-brand-primary transition-colors"
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
                    participantName={activeConvData?.participant_name ?? undefined}
                    contextType={activeConvData?.context_type}
                  />
                </div>
              </div>
            ) : (
              <NoConversationSelected />
            )}
          </div>

          {/* ── Right pane: action sidebar (lg+ only) ────────── */}
          {activeConversation && activeConvData && (
            <ActionSidebar
              conversationId={activeConversation}
              contextType={activeConvData.context_type as ContextType}
              contextId={activeConvData.context_id ?? null}
              participantName={activeConvData.participant_name}
            />
          )}
        </div>
      </div>
    </div>
  );
}
