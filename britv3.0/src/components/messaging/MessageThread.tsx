"use client";

/**
 * MessageThread -- renders messages in chronological order with cursor pagination.
 * Current user's messages right-aligned (primary), others left-aligned (muted).
 */

import { useEffect, useRef } from "react";
import { useMessages, useMarkAsRead } from "@/hooks/useMessages";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Message } from "@/types/messaging";

function MessageBubble(
  props: Readonly<{
    message: Message;
    isOwn: boolean;
  }>,
) {
  const { message, isOwn } = props;

  return (
    <div
      className={`flex flex-col max-w-[75%] ${
        isOwn ? "ml-auto items-end" : "mr-auto items-start"
      }`}
    >
      {!isOwn && (
        <span className="text-xs text-muted-foreground mb-1">
          {message.sender_name ?? "Unknown"}
        </span>
      )}
      <div
        className={`rounded-lg px-3 py-2 text-sm ${
          isOwn
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        {message.attachment_url && (
          <a
            href={message.attachment_url}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-1 inline-block text-xs underline ${
              isOwn
                ? "text-primary-foreground/80"
                : "text-muted-foreground"
            }`}
          >
            {message.attachment_type === "pdf" ? "View PDF" : "View image"}
          </a>
        )}
      </div>
      <span className="text-[10px] text-muted-foreground mt-1">
        {new Date(message.created_at).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    </div>
  );
}

function ThreadSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
        >
          <Skeleton className="h-12 w-48 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export default function MessageThread(
  props: Readonly<{
    conversationId: string;
    currentUserId: string;
  }>,
) {
  const { conversationId, currentUserId } = props;
  const bottomRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(conversationId);

  // Mark as read on mount
  useMarkAsRead(conversationId);

  // All messages, reversed so oldest first
  const allMessages =
    data?.pages.flatMap((page) => page.messages).reverse() ?? [];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages.length]);

  if (isLoading) return <ThreadSkeleton />;

  return (
    <div className="flex flex-col flex-1 overflow-y-auto p-4 space-y-3">
      {/* Load more button at top */}
      {hasNextPage && (
        <div className="flex justify-center pb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading..." : "Load older messages"}
          </Button>
        </div>
      )}

      {allMessages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          No messages yet. Start the conversation!
        </div>
      ) : (
        allMessages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.sender_id === currentUserId}
          />
        ))
      )}

      <div ref={bottomRef} />
    </div>
  );
}
