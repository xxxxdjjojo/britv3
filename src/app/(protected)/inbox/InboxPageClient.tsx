"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden border-t">
      {/* Conversation list - hidden on mobile when a thread is selected */}
      <div
        className={cn(
          "w-full max-w-xs border-r bg-card flex-shrink-0",
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
          <>
            <div className="flex items-center gap-2 border-b px-2 py-1.5 md:hidden">
              <Button
                variant="ghost"
                size="sm"
                aria-label="Back to inbox"
                onClick={() => {
                  setActiveConversation(null);
                  setActiveRecipientId(null);
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Inbox
              </Button>
            </div>
            <MessageThread conversationId={activeConversation} recipientId={activeRecipientId ?? ""} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
}
