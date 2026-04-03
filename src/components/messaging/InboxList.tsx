"use client";

/**
 * InboxList -- Conversation list wired to real useInbox() hook.
 */

import { useRef, useState, useCallback, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search, Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInbox } from "@/hooks/useInbox";
import { useAuth } from "@/hooks/useAuth";
import posthog from "posthog-js";
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
    currentUserId: string;
    onSelect: (id: string, recipientId: string) => void;
    onArchive: () => void;
    buttonRef: (el: HTMLButtonElement | null) => void;
  }>,
) {
  const { conversation: conv, isActive, currentUserId, onSelect, onArchive, buttonRef } = props;

  const otherUserId =
    conv.participant_1_id === currentUserId
      ? conv.participant_2_id
      : conv.participant_1_id;

  const initials =
    conv.participant_name
      ? conv.participant_name.slice(0, 2).toUpperCase()
      : "??";
  const name = conv.participant_name ?? "Unknown";
  const lastMessage = conv.last_message_preview ?? "No messages yet";
  const timestamp = relativeTime(conv.last_message_at);
  const hasUnread = conv.unread_count > 0;

  const contextType = conv.context_type;
  const badgeConfig =
    contextType === "rfq"
      ? { label: "Quote Request", className: "text-on-secondary-container bg-secondary-container" }
      : contextType === "booking"
        ? { label: "Viewing", className: "text-info bg-info-light" }
        : contextType === "listing"
          ? { label: "Property Enquiry", className: "text-white bg-brand-primary" }
          : null;

  const ariaLabel = `${name}, ${lastMessage}, ${timestamp}${hasUnread ? ", unread" : ""}`;

  return (
    <button
      ref={buttonRef}
      type="button"
      role="option"
      aria-selected={isActive}
      aria-label={ariaLabel}
      onClick={() => {
        posthog.capture("conversation_opened", {
          conversation_id: conv.id,
          has_unread: hasUnread,
        });
        onSelect(conv.id, otherUserId);
      }}
      className={cn(
        "group relative w-full text-left p-4 mx-2 rounded-xl cursor-pointer transition-colors mb-2",
        isActive
          ? "bg-surface-container-lowest shadow-[0_4px_20px_rgba(0,0,0,0.03)] border-l-4 border-brand-primary"
          : "bg-surface-container-low hover:bg-surface-container-high",
      )}
    >
      {/* Status badge + timestamp row */}
      <div className="flex justify-between items-start mb-1">
        {badgeConfig ? (
          <span className={cn("text-[10px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded", badgeConfig.className)}>
            {badgeConfig.label}
          </span>
        ) : (
          <span />
        )}
        <span className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Archive conversation"
            onClick={(e) => {
              e.stopPropagation();
              onArchive();
            }}
            className="sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-opacity p-1 rounded-md text-outline hover:text-error hover:bg-error/10"
          >
            <Archive className="h-3 w-3" />
          </button>
          <span className="text-[10px] text-outline">{timestamp}</span>
        </span>
      </div>

      {/* Name */}
      <h4
        className={cn(
          "font-heading text-sm truncate text-on-surface",
          hasUnread ? "font-bold" : "font-semibold",
        )}
      >
        {name}
      </h4>

      {/* Preview */}
      <p className="text-xs text-outline line-clamp-1 mt-1">
        {lastMessage}
      </p>

      {/* Unread dot */}
      {hasUnread && (
        <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-brand-primary" />
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Skeleton rows for loading state
// ---------------------------------------------------------------------------

function SkeletonRow() {
  return (
    <div className="p-4 mx-2 rounded-xl animate-pulse mb-2">
      <div className="flex justify-between mb-2">
        <div className="h-2.5 w-20 rounded bg-surface-container" />
        <div className="h-2.5 w-10 rounded bg-surface-container" />
      </div>
      <div className="h-3 w-2/3 rounded bg-surface-container mb-1.5" />
      <div className="h-2.5 w-3/4 rounded bg-surface-container" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// InboxList
// ---------------------------------------------------------------------------

export default function InboxList(
  props: Readonly<{
    activeId?: string;
    onSelectConversation?: (id: string, recipientId: string) => void;
  }>,
) {
  const { activeId, onSelectConversation } = props;
  const { user } = useAuth();
  const currentUserId = user?.id ?? "";
  const [search, setSearch] = useState("");
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const setItemRef = useCallback(
    (index: number) => (el: HTMLButtonElement | null) => {
      itemRefs.current[index] = el;
    },
    [],
  );

  function handleListKeyDown(e: React.KeyboardEvent) {
    const items = itemRefs.current.filter(Boolean) as HTMLButtonElement[];
    const currentIndex = items.findIndex((el) => el === document.activeElement);

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        items[Math.min(currentIndex + 1, items.length - 1)]?.focus();
        break;
      case "ArrowUp":
        e.preventDefault();
        items[Math.max(currentIndex - 1, 0)]?.focus();
        break;
      case "Home":
        e.preventDefault();
        items[0]?.focus();
        break;
      case "End":
        e.preventDefault();
        items[items.length - 1]?.focus();
        break;
    }
  }

  // Track inbox_searched after debounce — avoids firing on every keystroke
  useEffect(() => {
    if (!search) return;
    const timer = setTimeout(() => {
      posthog.capture("inbox_searched", {
        query_length: search.length,
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, error } = useInbox({
    search: search || undefined,
  });

  const conversations = data?.conversations ?? [];

  // TODO: Wire onArchive to a real archive/delete API endpoint once available.
  // The API route and Supabase mutation for archiving conversations does not
  // exist yet. For now the swipe gesture reveals the action visually only.
  function handleArchive(conversationId: string) {
    posthog.capture("conversation_archive_swiped", { conversation_id: conversationId });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline" />
          <Input
            placeholder="Search inquiries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-surface-container-lowest border-none rounded-lg text-sm focus:ring-1 focus:ring-brand-primary/20 placeholder:text-outline/60"
          />
        </div>
      </div>

      {/* Conversation list */}
      <ScrollArea className="flex-1">
        <div
          className="p-2 space-y-1"
          role="listbox"
          aria-label="Conversations"
          onKeyDown={handleListKeyDown}
        >
          {isLoading && (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          )}

          {!isLoading && error && (
            <div className="p-6 text-center font-body text-sm text-error">
              Failed to load conversations
            </div>
          )}

          {!isLoading && !error && conversations.length === 0 && (
            <div className="p-6 text-center font-body text-sm text-outline">
              No conversations found
            </div>
          )}

          {!isLoading &&
            !error &&
            conversations.map((conv, index) => (
              <ConversationRow
                key={conv.id}
                conversation={conv}
                isActive={conv.id === activeId}
                currentUserId={currentUserId}
                onSelect={onSelectConversation ?? (() => {})}
                onArchive={() => handleArchive(conv.id)}
                buttonRef={setItemRef(index)}
              />
            ))}
        </div>
      </ScrollArea>
    </div>
  );
}
