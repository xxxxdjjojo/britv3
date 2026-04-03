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
    <div className="flex items-center justify-between border-b border-surface-container px-6 py-4 bg-surface-container-lowest">
      <div className="flex items-center gap-4">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary-container text-on-primary-container text-sm font-bold">
            {initials || "?"}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-heading text-lg font-bold tracking-tight text-brand-primary">{displayName}</p>
          {propertyInfo && (
            <div className="flex items-center gap-3 mt-0.5">
              <span className="font-label text-[10px] font-bold tracking-widest uppercase text-outline">
                {propertyInfo.address}
              </span>
              {propertyInfo.price && (
                <>
                  <span className="w-1 h-1 rounded-full bg-outline-variant" />
                  <span className="font-label text-[10px] font-bold tracking-widest uppercase text-brand-secondary">
                    {propertyInfo.price}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button type="button" aria-label="Call" className="rounded-lg p-2 text-outline hover:text-brand-primary transition-colors">
          <Phone className="h-4 w-4" />
        </button>
        <button type="button" aria-label="Video call" className="rounded-lg p-2 text-outline hover:text-brand-primary transition-colors">
          <Video className="h-4 w-4" />
        </button>
        <button type="button" aria-label="More options" className="rounded-lg p-2 text-outline hover:text-brand-primary transition-colors">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function DateSeparator(props: Readonly<{ label: string }>) {
  return (
    <div className="flex items-center gap-3 py-4">
      <div className="flex-1 h-px bg-outline-variant/30" />
      <span className="font-body text-xs text-outline">{props.label}</span>
      <div className="flex-1 h-px bg-outline-variant/30" />
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
        "flex gap-4 max-w-3xl",
        isOwn ? "ml-auto flex-row-reverse" : "mr-auto",
      )}
    >
      {!isOwn && (
        <Avatar className="h-10 w-10 shrink-0 mt-1">
          <AvatarFallback className="bg-primary-container text-on-primary-container text-xs font-bold">
            {senderInitials}
          </AvatarFallback>
        </Avatar>
      )}
      {isOwn && (
        <div className="w-10 h-10 bg-primary-container rounded-full flex items-center justify-center text-on-primary-container font-bold text-xs shrink-0">
          {senderInitials}
        </div>
      )}
      <div
        className={cn(
          "flex flex-col space-y-2",
          isOwn ? "items-end" : "items-start",
        )}
      >
        <div className={cn("flex items-center gap-3", isOwn && "justify-end")}>
          {isOwn && <span className="text-[10px] text-outline font-medium">{time}</span>}
          <span className="font-heading text-sm font-bold text-brand-primary">
            {message.sender_name ?? "You"}
          </span>
          {!isOwn && <span className="text-[10px] text-outline font-medium">{time}</span>}
        </div>
        <div
          className={cn(
            "p-5 font-body text-sm leading-relaxed",
            isOwn
              ? "bg-brand-primary text-white rounded-2xl rounded-tr-none"
              : "bg-surface-container-low text-on-surface-variant rounded-2xl rounded-tl-none",
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        {message.attachment_url && (
          <div className="inline-flex items-center gap-3 p-3 bg-surface-container-low rounded-xl border border-outline-variant/10 text-xs">
            <FileText className="h-4 w-4 text-brand-primary" />
            <span className="font-medium">
              {message.attachment_type === "image" ? "Image" : "Document"}
            </span>
            {message.attachment_size_bytes && (
              <span className="text-outline uppercase text-[9px] font-bold tracking-wider">
                {message.attachment_size_bytes > 1048576
                  ? `${(message.attachment_size_bytes / 1048576).toFixed(1)} MB`
                  : `${Math.round(message.attachment_size_bytes / 1024)} KB`}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function QuickActionsBar() {
  return (
    <div className="flex gap-2 px-6 py-2 border-t border-surface-container overflow-x-auto shrink-0">
      {QUICK_ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.label}
            type="button"
            className="flex items-center gap-1.5 shrink-0 rounded-lg border border-outline-variant/20 px-3 py-1.5 text-xs font-medium text-on-surface-variant hover:text-brand-primary hover:border-brand-primary/30 transition-colors"
          >
            <Icon className="h-3.5 w-3.5" />
            {action.label}
          </button>
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

  // Aria-live region for announcing new incoming messages
  const [liveMessage, setLiveMessage] = useState("");

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
              // Announce incoming messages from others to screen readers
              if (newMsg.sender_id !== user?.id) {
                const sender = newMsg.sender_name ?? "Someone";
                setLiveMessage(`${sender}: ${newMsg.content}`);
              }
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
      void supabase.removeChannel(channel);
      void supabase.removeChannel(typingChannel);
      channelRef.current = null;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [conversationId, queryClient, user?.id]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-outline">
        Loading messages...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-error">
        Failed to load messages
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface">
      <ThreadHeader participantName={participantName} propertyInfo={propertyInfo} />

      {/* Message feed */}
      <ScrollArea className="flex-1">
        <div className="px-8 py-4 space-y-8" role="log" aria-label="Message history">
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

          {/* Screen reader announcement for new messages */}
          <div aria-live="polite" className="sr-only">
            {liveMessage}
          </div>

          {/* Scroll anchor */}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Bottom action area — constrained to prevent overlap */}
      <div className="shrink-0 max-h-[40%] flex flex-col">
        <QuickActionsBar />
        {isOtherTyping && (
          <div className="px-6 py-1 font-body text-xs text-outline italic flex items-center gap-1">
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
          currentUserId={user?.id ?? ""}
        />
      </div>
    </div>
  );
}
