"use client";

/**
 * InboxList -- Conversation list wired to real useInbox() hook.
 */

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInbox } from "@/hooks/useInbox";
import type { Conversation } from "@/types/messaging";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function relativeTime(date: Date): string {
  const now = Date.now();
  const diffMs = now - new Date(date).getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

// ---------------------------------------------------------------------------
// ConversationRow
// ---------------------------------------------------------------------------

function ConversationRow(
  props: Readonly<{
    conversation: Conversation;
    isActive: boolean;
    onSelect: (id: string) => void;
  }>,
) {
  const { conversation: conv, isActive, onSelect } = props;

  const initials =
    conv.participant_name
      ? conv.participant_name.slice(0, 2).toUpperCase()
      : "??";
  const name = conv.participant_name ?? "Unknown";
  const lastMessage = conv.last_message_preview ?? "No messages yet";
  const timestamp = relativeTime(conv.last_message_at);
  const hasUnread = conv.unread_count > 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(conv.id)}
      className={cn(
        "flex items-center gap-3 w-full text-left rounded-lg px-3 py-3 transition-colors hover:bg-muted/50",
        isActive && "bg-muted border-l-2 border-primary",
      )}
    >
      <div className="relative">
        <Avatar>
          <AvatarFallback className="bg-muted text-foreground text-sm font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
        {hasUnread && (
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-card" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "text-sm truncate text-foreground",
              hasUnread ? "font-bold" : "font-medium",
            )}
          >
            {name}
          </span>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {timestamp}
          </span>
        </div>
        <p className="text-xs truncate mt-0.5 text-muted-foreground">
          {lastMessage}
        </p>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Skeleton rows for loading state
// ---------------------------------------------------------------------------

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-3 py-3 animate-pulse">
      <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-1/2 rounded bg-muted" />
        <div className="h-3 w-3/4 rounded bg-muted" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// InboxList
// ---------------------------------------------------------------------------

export default function InboxList(
  props: Readonly<{
    activeId?: string;
    onSelectConversation?: (id: string) => void;
  }>,
) {
  const { activeId, onSelectConversation } = props;
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useInbox({
    search: search || undefined,
  });

  const conversations = data?.conversations ?? [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-foreground mb-3">Messages</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Conversation list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading && (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          )}

          {!isLoading && error && (
            <div className="p-6 text-center text-sm text-destructive">
              Failed to load conversations
            </div>
          )}

          {!isLoading && !error && conversations.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No conversations found
            </div>
          )}

          {!isLoading &&
            !error &&
            conversations.map((conv) => (
              <ConversationRow
                key={conv.id}
                conversation={conv}
                isActive={conv.id === activeId}
                onSelect={onSelectConversation ?? (() => {})}
              />
            ))}
        </div>
      </ScrollArea>
    </div>
  );
}
