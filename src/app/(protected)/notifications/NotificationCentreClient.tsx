"use client";

/**
 * Notification Centre page — tabbed view with All, Unread, and System tabs.
 * Mark-all-read action. Cursor-based load-more pagination.
 */

import { useState, useRef } from "react";
import {
  Bell,
  Home,
  TrendingUp,
  Calendar,
  ShieldAlert,
  MessageSquare,
  Star,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  useNotifications,
  useMarkAllRead,
  useNotificationCount,
} from "@/hooks/useNotifications";
import type { PlatformEvent, EventType } from "@/types/notifications";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabId = "all" | "unread" | "system";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function relativeTime(date: Date | string): string {
  const d = new Date(date);
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

type IconConfig = Readonly<{
  icon: React.ComponentType<Readonly<{ className?: string }>>;
  bg: string;
  color: string;
}>;

function getIconConfig(eventType: EventType): IconConfig {
  switch (eventType) {
    case "viewing_scheduled":
      return {
        icon: Calendar,
        bg: "bg-amber-100 dark:bg-amber-900/20",
        color: "text-amber-600",
      };
    case "offer_received":
      return {
        icon: TrendingUp,
        bg: "bg-green-100 dark:bg-green-900/20",
        color: "text-green-600",
      };
    case "quote_received":
    case "quote_sent":
      return {
        icon: TrendingUp,
        bg: "bg-green-100 dark:bg-green-900/20",
        color: "text-green-600",
      };
    case "booking_confirmed":
    case "booking_updated":
      return {
        icon: Home,
        bg: "bg-blue-100 dark:bg-blue-900/20",
        color: "text-blue-600",
      };
    case "milestone_updated":
      return {
        icon: ShieldAlert,
        bg: "bg-rose-100 dark:bg-rose-900/20",
        color: "text-rose-600",
      };
    case "new_message":
      return {
        icon: MessageSquare,
        bg: "bg-slate-100 dark:bg-slate-900/20",
        color: "text-slate-600",
      };
    case "review_posted":
      return {
        icon: Star,
        bg: "bg-amber-100 dark:bg-amber-900/20",
        color: "text-amber-600",
      };
    default:
      return {
        icon: Bell,
        bg: "bg-slate-100 dark:bg-slate-900/20",
        color: "text-slate-600",
      };
  }
}

function getDescription(event: PlatformEvent): string {
  const actor = event.actor_name ?? "Someone";
  switch (event.event_type) {
    case "new_message":
      return `${actor} sent you a message`;
    case "quote_received":
      return `${actor} sent you a quote`;
    case "quote_sent":
      return `You sent a quote to ${actor}`;
    case "booking_confirmed":
      return `Booking with ${actor} confirmed`;
    case "booking_updated":
      return `${actor} updated a booking`;
    case "milestone_updated":
      return `${actor} updated a milestone`;
    case "offer_received":
      return `${actor} made an offer on your property`;
    case "viewing_scheduled":
      return `${actor} scheduled a viewing`;
    case "review_posted":
      return `${actor} posted a review`;
    default:
      return `${actor} performed an action`;
  }
}

/** Event types that belong to the "system" tab (non-social, platform events) */
const SYSTEM_EVENT_TYPES: Set<EventType> = new Set([
  "booking_confirmed",
  "booking_updated",
  "milestone_updated",
]);

// ---------------------------------------------------------------------------
// NotificationCard sub-component
// ---------------------------------------------------------------------------

type NotificationCardProps = Readonly<{
  notification: PlatformEvent;
  isUnread: boolean;
}>;

function NotificationCard({ notification, isUnread }: NotificationCardProps) {
  const iconConfig = getIconConfig(notification.event_type);
  const Icon = iconConfig.icon;

  return (
    <div
      className={cn(
        "rounded-xl bg-card p-4 shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60",
        isUnread && "border-l-4 border-l-brand-primary",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm",
            iconConfig.bg,
          )}
        >
          <Icon className={cn("h-5 w-5", iconConfig.color)} />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "font-body text-sm text-foreground",
              isUnread && "font-semibold",
            )}
          >
            {getDescription(notification)}
          </p>
          <p className="mt-1 font-body text-xs text-neutral-500">
            {relativeTime(notification.created_at)}
          </p>
        </div>
        {isUnread && (
          <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-primary" />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Pull-to-refresh constants
// ---------------------------------------------------------------------------

const PULL_THRESHOLD = 60;

export default function NotificationCentreClient() {
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  // Pull-to-refresh state
  const [pullOffset, setPullOffset] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullStartY = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const { data, isLoading, refetch } = useNotifications(cursor);
  const { data: countData } = useNotificationCount();
  const markAllRead = useMarkAllRead();

  const notifications = data?.notifications ?? [];
  const lastReadAt = data?.lastReadAt ?? null;
  const nextCursor = data?.nextCursor ?? null;

  const isUnread = (n: PlatformEvent): boolean =>
    lastReadAt ? new Date(n.created_at) > new Date(lastReadAt) : true;

  const unreadCount = countData?.count ?? notifications.filter(isUnread).length;
  const total = notifications.length;

  const filteredNotifications: PlatformEvent[] = (() => {
    switch (activeTab) {
      case "unread":
        return notifications.filter(isUnread);
      case "system":
        return notifications.filter((n) =>
          SYSTEM_EVENT_TYPES.has(n.event_type),
        );
      default:
        return notifications;
    }
  })();

  function handleMarkAllRead() {
    markAllRead.mutate();
  }

  // Pull-to-refresh handlers — only activate when the list is scrolled to top
  function handlePullTouchStart(e: React.TouchEvent) {
    const el = listRef.current;
    if (!el) return;
    const scrollParent = el.closest("[data-scroll-container]") ?? el;
    if ((scrollParent as HTMLElement).scrollTop === 0) {
      pullStartY.current = e.touches[0].clientY;
    }
  }

  function handlePullTouchMove(e: React.TouchEvent) {
    if (pullStartY.current === null || isRefreshing) return;
    const dy = e.touches[0].clientY - pullStartY.current;
    if (dy > 0) {
      // Dampen the offset so it feels resistant — sqrt gives a natural feel
      const dampened = Math.min(Math.sqrt(dy) * 4, PULL_THRESHOLD * 1.5);
      setPullOffset(dampened);
    }
  }

  async function handlePullTouchEnd() {
    if (pullOffset >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullOffset(PULL_THRESHOLD);
      try {
        await refetch();
      } finally {
        setIsRefreshing(false);
        setPullOffset(0);
      }
    } else {
      setPullOffset(0);
    }
    pullStartY.current = null;
  }

  const showPullIndicator = pullOffset > 0 || isRefreshing;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold text-foreground">
            Notification Centre
          </h1>
          <p className="font-body text-sm text-neutral-500">
            {total} notifications
          </p>
        </div>
        <button
          type="button"
          onClick={handleMarkAllRead}
          disabled={isLoading || markAllRead.isPending}
          className="rounded-lg border border-neutral-200/60 px-3 py-1.5 font-body text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50 dark:border-neutral-700/60 focus-visible:ring-2 focus-visible:ring-neutral-400/30 focus-visible:ring-offset-2"
        >
          Mark all as read
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b border-neutral-100/60 dark:border-neutral-700/60">
        {(["all", "unread", "system"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 font-body text-sm font-medium capitalize transition-colors focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2",
              activeTab === tab
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-neutral-500 hover:text-foreground",
            )}
          >
            {tab === "unread"
              ? `Unread (${unreadCount})`
              : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Pull-to-refresh indicator */}
      {showPullIndicator && (
        <div
          className="flex items-center justify-center gap-2 overflow-hidden py-2 font-body text-sm text-neutral-500 transition-all"
          style={{ height: `${Math.min(pullOffset, PULL_THRESHOLD)}px` }}
          aria-live="polite"
          aria-label={
            isRefreshing ? "Refreshing notifications" : "Pull to refresh"
          }
        >
          <RefreshCw
            className={cn("h-4 w-4", isRefreshing && "animate-spin")}
          />
          <span>{isRefreshing ? "Refreshing…" : "Release to refresh"}</span>
        </div>
      )}

      {/* Notification list */}
      <div
        ref={listRef}
        onTouchStart={handlePullTouchStart}
        onTouchMove={handlePullTouchMove}
        onTouchEnd={handlePullTouchEnd}
        style={{
          transform: `translateY(${Math.min(pullOffset, PULL_THRESHOLD)}px)`,
          transition:
            pullStartY.current === null ? "transform 0.2s ease" : "none",
        }}
      >
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl p-4 ring-1 ring-neutral-200/60 dark:ring-neutral-700/60"
              >
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-full bg-neutral-100 dark:bg-neutral-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-neutral-100 dark:bg-neutral-800" />
                    <div className="h-3 w-1/2 rounded bg-neutral-100 dark:bg-neutral-800" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
              <Bell className="size-8 text-neutral-400" />
            </div>
            <p className="font-heading text-base font-semibold text-foreground">
              No notifications
            </p>
            <p className="mt-1 font-body text-sm text-neutral-500">
              You&apos;re all caught up!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                isUnread={isUnread(notification)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Load more */}
      {nextCursor && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCursor(nextCursor)}
            disabled={isLoading}
            className="font-body text-sm text-neutral-500 hover:text-foreground"
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
