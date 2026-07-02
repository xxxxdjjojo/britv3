"use client";

/**
 * MessageThread -- Real-time chat thread backed by useMessages() + Supabase Realtime.
 * Styled with the Message / Bubble / MessageScroller conversation primitives.
 */

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Message,
  MessageGroup,
  MessageAvatar,
  MessageContent,
  MessageHeader,
  MessageFooter,
} from "@/components/ui/message";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { MessageScroller } from "@/components/ui/message-scroller";
import {
  Phone,
  Video,
  MoreVertical,
  Calendar,
  FileText,
  MapPin,
  CheckCheck,
} from "lucide-react";
import { useMessages, useMarkAsRead } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import MessageComposer from "@/components/messaging/MessageComposer";
import type { Message as MessageType } from "@/types/messaging";

/* ---------- Constants ---------- */

const QUICK_ACTIONS = [
  { label: "Schedule Viewing", icon: Calendar },
  { label: "Send Document", icon: FileText },
  { label: "Share Location", icon: MapPin },
] as const;

/* ---------- Helpers ---------- */

function initialsOf(name: string | null | undefined): string {
  return (name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

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
  const initials = initialsOf(displayName);

  return (
    <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar>
            <AvatarFallback className="bg-brand-primary-lighter text-brand-primary-dark text-sm font-semibold">
              {initials || "?"}
            </AvatarFallback>
          </Avatar>
        </div>
        <div>
          <p className="font-heading text-sm font-semibold text-foreground">{displayName}</p>
          {propertyInfo && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground border border-border rounded-lg px-2 py-1 bg-muted/40 mt-1">
              <span className="font-medium truncate max-w-48">{propertyInfo.address}</span>
              {propertyInfo.price && (
                <span className="text-brand-primary font-semibold">{propertyInfo.price}</span>
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
    <div className="flex items-center justify-center py-3">
      <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {props.label}
      </span>
    </div>
  );
}

/**
 * A single message rendered with the Message/Bubble primitives.
 * Own messages align="end" in brand-green; others align="start" in muted grey.
 * `showAvatar`/`showHeader` are controlled by the group so only the last message
 * in a run carries the avatar and only the first carries the sender name.
 */
export function MessageBubble(
  props: Readonly<{
    message: MessageType;
    isOwn: boolean;
    showAvatar?: boolean;
    showHeader?: boolean;
  }>,
) {
  const { message, isOwn, showAvatar = true, showHeader = false } = props;
  const time = new Date(message.created_at).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Message
      align={isOwn ? "end" : "start"}
      data-testid={`message-${message.id}`}
      className="px-1"
    >
      {!isOwn && (
        <MessageAvatar className="bg-transparent">
          {showAvatar ? (
            <Avatar size="sm">
              <AvatarFallback className="bg-brand-primary-lighter text-brand-primary-dark text-[10px] font-semibold">
                {initialsOf(message.sender_name)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <span aria-hidden className="size-6" />
          )}
        </MessageAvatar>
      )}

      <MessageContent>
        {showHeader && !isOwn && (
          <MessageHeader>{message.sender_name ?? "Unknown"}</MessageHeader>
        )}

        <Bubble variant={isOwn ? "default" : "muted"} align={isOwn ? "end" : "start"}>
          <BubbleContent className="shadow-sm">
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
            {message.attachment_url && (
              <div className="mt-1.5">
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
          </BubbleContent>
        </Bubble>

        <MessageFooter className="gap-1">
          <time dateTime={new Date(message.created_at).toISOString()}>{time}</time>
          {isOwn && <CheckCheck className="size-3.5 text-brand-primary" aria-label="Delivered" />}
        </MessageFooter>
      </MessageContent>
    </Message>
  );
}

/**
 * Renders the flat message list as MessageGroups, stacking consecutive messages
 * from the same sender. Only the last message in a run shows the avatar; only the
 * first shows the sender header.
 */
export function MessageGroupList(
  props: Readonly<{ messages: ReadonlyArray<MessageType>; currentUserId?: string }>,
) {
  const { messages, currentUserId } = props;

  // Partition into runs of consecutive same-sender messages.
  const groups: MessageType[][] = [];
  for (const m of messages) {
    const last = groups[groups.length - 1];
    if (last && last[0].sender_id === m.sender_id) {
      last.push(m);
    } else {
      groups.push([m]);
    }
  }

  return (
    <>
      {groups.map((group) => {
        const isOwn = group[0].sender_id === currentUserId;
        return (
          <MessageGroup key={group[0].id} data-testid="message-group">
            {group.map((m, i) => (
              <MessageBubble
                key={m.id}
                message={m}
                isOwn={isOwn}
                showAvatar={i === group.length - 1}
                showHeader={i === 0}
              />
            ))}
          </MessageGroup>
        );
      })}
    </>
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

  // Aria-live region for announcing new incoming messages
  const [liveMessage, setLiveMessage] = useState("");

  // Flatten pages into a sorted array — pages are newest-first, so reverse for display
  const messages = data?.pages.flatMap((p) => p.messages).reverse() ?? [];

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
                    pages: { messages: MessageType[] }[];
                    pageParams: unknown[];
                  }
                | undefined,
            ) => {
              if (!old) return old;
              const newMsg = payload.new as MessageType;
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
    <div className="flex flex-col h-full bg-surface">
      <ThreadHeader participantName={participantName} propertyInfo={propertyInfo} />

      {/* Message feed — MessageScroller sticks to bottom on new messages */}
      <MessageScroller stickToBottomKey={messages.length}>
        <div className="flex flex-col gap-3 p-4" role="log" aria-label="Message history">
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

          <MessageGroupList messages={messages} currentUserId={user?.id} />

          {/* Screen reader announcement for new messages */}
          <div aria-live="polite" className="sr-only">
            {liveMessage}
          </div>
        </div>
      </MessageScroller>

      <QuickActionsBar />
      {isOtherTyping && (
        <div
          role="status"
          className="px-4 py-1 text-xs text-muted-foreground italic flex items-center gap-1"
        >
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
  );
}
