"use client";

/**
 * MessageThread -- Real-time chat thread backed by useMessages() + Supabase Realtime.
 */

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Phone,
  Video,
  MoreVertical,
  Calendar,
  FileText,
  MapPin,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMessages, useMarkAsRead } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import MessageComposer from "@/components/messaging/MessageComposer";
import type { Message } from "@/types/messaging";

/* ---------- Constants ---------- */

const QUICK_ACTIONS = [
  { label: "Schedule Viewing", icon: Calendar },
  { label: "Send Document", icon: FileText },
  { label: "Share Location", icon: MapPin },
  { label: "Request Quote", icon: CreditCard },
] as const;

/* ---------- Sub-components ---------- */

type PropertyInfo = { address: string; price?: string } | null;

function ThreadHeader(
  props: Readonly<{
    participantName?: string;
    propertyInfo?: PropertyInfo;
  }>,
) {
  const { participantName, propertyInfo } = props;
  const displayName = participantName ?? "Conversation";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center justify-between border-b px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar>
            <AvatarFallback className="bg-muted text-foreground text-sm font-medium">
              {initials || "?"}
            </AvatarFallback>
          </Avatar>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{displayName}</p>
          {propertyInfo && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground border rounded-lg px-2 py-1 bg-muted/30 mt-1">
              <span className="font-medium truncate max-w-48">{propertyInfo.address}</span>
              {propertyInfo.price && (
                <span className="text-primary font-semibold">{propertyInfo.price}</span>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="Call">
          <Phone className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Video call">
          <Video className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="More options">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function DateSeparator(props: Readonly<{ label: string }>) {
  return (
    <div className="flex items-center gap-3 py-4">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground">{props.label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

function MessageBubble(
  props: Readonly<{ message: Message; isOwn: boolean }>,
) {
  const { message, isOwn } = props;
  const time = new Date(message.created_at).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const senderInitials = (message.sender_name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "flex gap-2 max-w-[75%]",
        isOwn ? "ml-auto flex-row-reverse" : "mr-auto",
      )}
    >
      {!isOwn && (
        <Avatar className="h-8 w-8 shrink-0 mt-1">
          <AvatarFallback className="bg-muted text-foreground text-xs font-medium">
            {senderInitials}
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          "flex flex-col",
          isOwn ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm",
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-none"
              : "bg-card border rounded-bl-none",
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
          {message.attachment_url && (
            <div className="mt-1">
              {message.attachment_type === "image" ? (
                <img
                  src={message.attachment_url}
                  alt="attachment"
                  className="rounded-lg max-w-48 aspect-video object-cover"
                />
              ) : (
                <a
                  href={message.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs underline"
                >
                  <FileText className="h-3 w-3" /> Download PDF
                </a>
              )}
            </div>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground mt-1">
          {time}
        </span>
      </div>
    </div>
  );
}

function QuickActionsBar() {
  return (
    <div className="flex gap-2 px-4 py-2 border-t overflow-x-auto">
      {QUICK_ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.label}
            variant="outline"
            size="sm"
            className="rounded-full shrink-0 text-xs gap-1.5"
          >
            <Icon className="h-3.5 w-3.5" />
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}

/* ---------- Main component ---------- */

export default function MessageThread(
  props: Readonly<{
    conversationId: string;
    recipientId?: string;
    participantName?: string;
    contextType?: string;
    propertyInfo?: PropertyInfo;
  }>,
) {
  const { conversationId, recipientId, participantName, contextType, propertyInfo = null } = props;

  const { data, isLoading, error, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useMessages(conversationId);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Mark conversation as read on mount
  useMarkAsRead(conversationId);

  // Typing indicator state
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Flatten pages into a sorted array — pages are newest-first, so reverse for display
  const messages = data?.pages.flatMap((p) => p.messages).reverse() ?? [];

  // Auto-scroll to bottom on new messages
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Realtime subscription for live new messages
  const channelRef = useRef<RealtimeChannel | null>(null);
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Append to React Query cache without a full refetch
          queryClient.setQueryData(
            ["messages", conversationId],
            (
              old:
                | {
                    pages: { messages: Message[] }[];
                    pageParams: unknown[];
                  }
                | undefined,
            ) => {
              if (!old) return old;
              const newMsg = payload.new as Message;
              // Dedup: skip if already in cache
              const allMsgs = old.pages.flatMap((p) => p.messages);
              if (allMsgs.some((m) => m.id === newMsg.id)) return old;
              // Add to first page (newest first)
              const newPages = [...old.pages];
              newPages[0] = {
                ...newPages[0],
                messages: [newMsg, ...newPages[0].messages],
              };
              return { ...old, pages: newPages };
            },
          );
          // Refresh inbox list to update last_message_preview
          void queryClient.invalidateQueries({ queryKey: ["inbox"] });
        },
      )
      .subscribe();
    channelRef.current = channel;

    // Typing indicator broadcast channel
    const typingChannel = supabase
      .channel(`typing:${conversationId}`)
      .on(
        "broadcast",
        { event: "typing" },
        (payload: { payload: { user_id: string; is_typing: boolean } }) => {
          if (payload.payload.user_id === user?.id) return;
          setIsOtherTyping(payload.payload.is_typing);
          if (payload.payload.is_typing) {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => setIsOtherTyping(false), 3000);
          }
        },
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
      channelRef.current = null;
      void typingChannel.unsubscribe();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [conversationId, queryClient, user?.id]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
        Loading messages...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-destructive">
        Failed to load messages
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <ThreadHeader participantName={participantName} propertyInfo={propertyInfo} />

      {/* Message feed */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {/* Load earlier messages */}
          {hasNextPage && (
            <div className="flex justify-center py-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "Loading..." : "Load earlier messages"}
              </Button>
            </div>
          )}

          <DateSeparator label="Today" />

          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.sender_id === user?.id}
            />
          ))}

          {/* Scroll anchor */}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <QuickActionsBar />
      {isOtherTyping && (
        <div className="px-4 py-1 text-xs text-muted-foreground italic flex items-center gap-1">
          <span className="inline-flex gap-0.5">
            <span className="animate-bounce" style={{ animationDelay: "0ms" }}>•</span>
            <span className="animate-bounce" style={{ animationDelay: "150ms" }}>•</span>
            <span className="animate-bounce" style={{ animationDelay: "300ms" }}>•</span>
          </span>
          {participantName ?? "Someone"} is typing...
        </div>
      )}
      <MessageComposer
        conversationId={conversationId}
        recipientId={recipientId ?? ""}
        contextType={contextType}
      />
    </div>
  );
}
