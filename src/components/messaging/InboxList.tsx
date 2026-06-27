"use client";

/**
 * InboxList -- presentational conversation list. Receives an already
 * folder-filtered conversation list from the shell and renders rows with
 * swipe-to-archive plus a per-row archive / mark-as-spam action menu.
 */

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search, MoreVertical, Archive, ArchiveRestore, ShieldAlert, ShieldCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useArchiveConversation, useBlockConversation } from "@/hooks/useInbox";
import { useAuth } from "@/hooks/useAuth";
import posthog from "posthog-js";
import type { Conversation, Folder } from "@/types/messaging";

const EMPTY_STATE_BY_FOLDER: Record<Folder, string> = {
  inbox: "No conversations yet",
  unread: "No unread conversations",
  sent: "No sent conversations",
  drafts: "No drafts",
  archived: "No archived conversations",
  spam: "No blocked conversations",
};

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
// SwipeableConversationRow — wraps ConversationRow with swipe-to-archive
// ---------------------------------------------------------------------------

const SWIPE_THRESHOLD = 80;

function SwipeableConversationRow(
  props: Readonly<{
    children: React.ReactNode;
    onArchive: () => void;
    actionLabel?: string;
  }>,
) {
  const { children, onArchive, actionLabel = "Archive" } = props;
  const [offset, setOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const touchStartX = useRef<number | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    setIsAnimating(false);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    // Only allow left swipe (negative direction)
    if (dx < 0) {
      // Cap at -SWIPE_THRESHOLD * 1.5 to prevent over-drag
      setOffset(Math.max(dx, -SWIPE_THRESHOLD * 1.5));
    }
  }

  function handleTouchEnd() {
    setIsAnimating(true);
    if (offset <= -SWIPE_THRESHOLD) {
      // Snap to reveal position briefly, then call onArchive
      setOffset(-SWIPE_THRESHOLD);
      // Allow a moment to see the revealed action before snapping back
      setTimeout(() => {
        onArchive();
        setOffset(0);
      }, 200);
    } else {
      // Snap back
      setOffset(0);
    }
    touchStartX.current = null;
  }

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Archive action revealed behind the row (only while swiping) */}
      <div
        className="absolute right-0 inset-y-0 flex items-center rounded-r-lg bg-destructive px-4 text-destructive-foreground text-sm font-medium transition-opacity"
        style={{ opacity: offset < 0 ? 1 : 0 }}
        aria-hidden="true"
      >
        {actionLabel}
      </div>

      {/* Swipeable row */}
      <div
        style={{
          transform: `translateX(${offset}px)`,
          transition: isAnimating ? "transform 0.2s ease" : "none",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
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
    onBlock: () => void;
    buttonRef: (el: HTMLButtonElement | null) => void;
  }>,
) {
  const { conversation: conv, isActive, currentUserId, onSelect, onArchive, onBlock, buttonRef } =
    props;

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
  const isArchived = conv.archived_at != null;
  const isBlocked = conv.blocked_at != null;

  const ariaLabel = `${name}, ${lastMessage}, ${timestamp}${hasUnread ? ", unread" : ""}`;

  return (
    <div
      className={cn(
        "group/row relative flex items-center rounded-xl bg-surface transition-colors hover:bg-muted/60",
        isActive && "bg-brand-primary-lighter",
      )}
    >
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
          "flex flex-1 min-w-0 items-center gap-3 rounded-xl px-3 py-3 text-left",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40",
          isActive && "border-l-2 border-brand-primary",
        )}
      >
        <div className="relative shrink-0">
          <Avatar>
            <AvatarFallback className="bg-brand-primary-lighter text-brand-primary-dark text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {hasUnread && (
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-brand-primary border-2 border-surface" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "text-sm truncate",
                hasUnread ? "font-bold text-brand-primary-dark" : "font-medium text-foreground",
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

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "mr-1 inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors",
            "opacity-0 focus-visible:opacity-100 group-hover/row:opacity-100 data-popup-open:opacity-100",
            "hover:bg-brand-primary-lighter hover:text-brand-primary-dark",
          )}
          aria-label={`Actions for ${name}`}
        >
          <MoreVertical className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onArchive}>
            {isArchived ? (
              <>
                <ArchiveRestore className="h-4 w-4" />
                Move to inbox
              </>
            ) : (
              <>
                <Archive className="h-4 w-4" />
                Archive
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onBlock} variant={isBlocked ? undefined : "destructive"}>
            {isBlocked ? (
              <>
                <ShieldCheck className="h-4 w-4" />
                Unblock
              </>
            ) : (
              <>
                <ShieldAlert className="h-4 w-4" />
                Mark as spam
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
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
    /** Already folder-filtered conversation list (the shell owns the hook). */
    conversations: Conversation[];
    /** Which folder these conversations belong to — drives the empty-state copy. */
    folder: Folder;
    isLoading?: boolean;
    error?: unknown;
    activeId?: string;
    onSelectConversation?: (id: string, recipientId: string) => void;
  }>,
) {
  const {
    conversations: folderConversations,
    folder,
    isLoading = false,
    error = null,
    activeId,
    onSelectConversation,
  } = props;
  const hasError = Boolean(error);
  const { user } = useAuth();
  const currentUserId = user?.id ?? "";
  const archiveMutation = useArchiveConversation();
  const blockMutation = useBlockConversation();
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

  // Search filters the already-folder-filtered list client-side (matches name
  // or last-message preview). No extra server round-trip per keystroke.
  const conversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return folderConversations;
    return folderConversations.filter((conv) => {
      const name = conv.participant_name?.toLowerCase() ?? "";
      const preview = conv.last_message_preview?.toLowerCase() ?? "";
      return name.includes(q) || preview.includes(q);
    });
  }, [folderConversations, search]);

  function handleArchive(conv: Conversation) {
    const archived = conv.archived_at == null;
    posthog.capture("conversation_archived", {
      conversation_id: conv.id,
      archived,
    });
    archiveMutation.mutate({ conversationId: conv.id, archived });
  }

  function handleBlock(conv: Conversation) {
    const blocked = conv.blocked_at == null;
    posthog.capture("conversation_blocked", {
      conversation_id: conv.id,
      blocked,
    });
    blockMutation.mutate({ conversationId: conv.id, blocked });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border bg-surface">
        <h2 className="font-heading text-lg font-bold text-foreground mb-3">Messages</h2>
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

          {!isLoading && hasError && (
            <div className="p-6 text-center text-sm text-destructive">
              Failed to load conversations
            </div>
          )}

          {!isLoading && !hasError && conversations.length === 0 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              {search.trim() ? "No conversations match your search" : EMPTY_STATE_BY_FOLDER[folder]}
            </div>
          )}

          {!isLoading &&
            !hasError &&
            conversations.map((conv, index) => (
              <SwipeableConversationRow
                key={conv.id}
                onArchive={() => handleArchive(conv)}
                actionLabel={conv.archived_at != null ? "Unarchive" : "Archive"}
              >
                <ConversationRow
                  conversation={conv}
                  isActive={conv.id === activeId}
                  currentUserId={currentUserId}
                  onSelect={onSelectConversation ?? (() => {})}
                  onArchive={() => handleArchive(conv)}
                  onBlock={() => handleBlock(conv)}
                  buttonRef={setItemRef(index)}
                />
              </SwipeableConversationRow>
            ))}
        </div>
      </ScrollArea>
    </div>
  );
}
