"use client";

import { use, useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { JSX } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useMessages, useSendMessage, useMarkAsRead } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";
import type { Message } from "@/types/messaging";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(date: Date): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function formatDateGroup(date: Date): string {
  const d = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MessageBubble({
  message,
  isSent,
}: {
  message: Message;
  isSent: boolean;
}) {
  const senderLabel = message.sender_name ?? "Unknown";
  const time = formatTime(message.created_at);

  return (
    <div className={`flex gap-2 ${isSent ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar initials */}
      <div
        className="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0 mt-0.5"
        aria-hidden
      >
        {getInitials(message.sender_name)}
      </div>

      {/* Bubble */}
      <div className={`max-w-[70%] space-y-1 ${isSent ? "items-end" : "items-start"} flex flex-col`}>
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
            isSent
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-muted text-foreground rounded-tl-sm"
          }`}
        >
          {message.content}

          {/* Attachment */}
          {message.attachment_url && (
            <a
              href={message.attachment_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-2 flex items-center gap-1.5 text-xs underline-offset-2 hover:underline ${
                isSent ? "text-primary-foreground/80" : "text-muted-foreground"
              }`}
            >
              <Paperclip className="size-3 shrink-0" />
              <span>
                {message.attachment_type === "image" ? "Image" : "PDF"}
                {message.attachment_size_bytes
                  ? ` (${formatBytes(message.attachment_size_bytes)})`
                  : ""}
              </span>
            </a>
          )}
        </div>

        <div className={`flex items-center gap-1.5 ${isSent ? "flex-row-reverse" : "flex-row"}`}>
          <span className="text-xs text-muted-foreground">{senderLabel}</span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{time}</span>
        </div>
      </div>
    </div>
  );
}

function MessageSkeleton() {
  return (
    <div className="space-y-4 px-4 py-4">
      {[false, true, false].map((right, i) => (
        <div key={i} className={`flex gap-2 ${right ? "flex-row-reverse" : "flex-row"}`}>
          <Skeleton className="size-8 rounded-full shrink-0" />
          <Skeleton className={`h-12 rounded-2xl ${right ? "w-48" : "w-56"}`} />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Flatten messages from infinite query pages
// ---------------------------------------------------------------------------

function flattenPages(pages: { messages: Message[] }[]): Message[] {
  // Pages arrive newest-first in our scheme; reverse to chronological
  return [...pages].reverse().flatMap((p) => [...p.messages].reverse());
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MessageThreadPage(props: { params: Promise<{ role: string; id: string }> }) {
  const resolvedParams = use(props.params);
  const { id: conversationId } = resolvedParams;

  // Also accept via useParams for client-side navigation
  const routeParams = useParams();
  const effectiveRole = (resolvedParams.role ?? routeParams.role) as string;

  const { user } = useAuth();
  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useMessages(conversationId);

  // Mark as read on mount
  useMarkAsRead(conversationId);

  const [content, setContent] = useState("");
  const sendMutation = useSendMessage(conversationId);

  const bottomRef = useRef<HTMLDivElement>(null);
  const didScrollRef = useRef(false);

  const allMessages = data ? flattenPages(data.pages) : [];

  // Scroll to bottom on first load
  useEffect(() => {
    if (!isLoading && allMessages.length > 0 && !didScrollRef.current) {
      didScrollRef.current = true;
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [isLoading, allMessages.length]);

  // Scroll to bottom after sending
  useEffect(() => {
    if (sendMutation.isSuccess) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [sendMutation.isSuccess]);

  function handleSend() {
    const trimmed = content.trim();
    if (!trimmed || sendMutation.isPending) return;

    // We need a recipient_id; derive from first message sender that isn't us
    const otherMessage = allMessages.find((m) => m.sender_id !== user?.id);
    const recipientId = otherMessage?.sender_id ?? "";

    sendMutation.mutate(
      { content: trimmed, recipient_id: recipientId },
      {
        onSuccess: () => setContent(""),
      },
    );
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Derive participant name from messages
  const participantName =
    allMessages.find((m) => m.sender_id !== user?.id)?.sender_name ?? null;
  const headerTitle = participantName ?? "Conversation";

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[800px]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b shrink-0">
        <Link
          href={`/dashboard/${effectiveRole}/messages`}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>
        <div className="h-5 w-px bg-border" />
        <span className="text-sm font-semibold truncate">{headerTitle}</span>
      </div>

      {/* Message list */}
      <Card className="flex-1 overflow-hidden mt-4">
        <CardContent className="h-full overflow-y-auto p-4 space-y-4 flex flex-col">
          {/* Load Earlier */}
          {hasNextPage && (
            <div className="flex justify-center pb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "Loading…" : "Load Earlier"}
              </Button>
            </div>
          )}

          {/* Loading state */}
          {isLoading && <MessageSkeleton />}

          {/* Error state */}
          {isError && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm text-muted-foreground">Failed to load messages.</p>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !isError && allMessages.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm text-muted-foreground">No messages yet. Say hello!</p>
            </div>
          )}

          {/* Messages grouped by date */}
          {!isLoading && allMessages.length > 0 && (() => {
            const items: JSX.Element[] = [];
            let lastDateGroup = "";

            allMessages.forEach((msg) => {
              const dateGroup = formatDateGroup(msg.created_at);
              if (dateGroup !== lastDateGroup) {
                lastDateGroup = dateGroup;
                items.push(
                  <div key={`date-${dateGroup}`} className="flex items-center gap-3 py-1">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground px-2 shrink-0">{dateGroup}</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>,
                );
              }

              items.push(
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isSent={msg.sender_id === user?.id}
                />,
              );
            });

            return items;
          })()}

          {/* Scroll anchor */}
          <div ref={bottomRef} />
        </CardContent>
      </Card>

      {/* Send form */}
      <div className="mt-3 flex gap-2 items-end shrink-0">
        <Textarea
          placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          className="resize-none min-h-[60px] max-h-[160px]"
          rows={2}
          disabled={sendMutation.isPending}
        />
        <Button
          onClick={handleSend}
          disabled={!content.trim() || sendMutation.isPending}
          className="shrink-0 self-end"
        >
          {sendMutation.isPending ? "Sending…" : "Send"}
        </Button>
      </div>
    </div>
  );
}
