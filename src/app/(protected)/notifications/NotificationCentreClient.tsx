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
  ChevronDown,
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
      return { icon: Calendar, bg: "bg-amber-100", color: "text-amber-600" };
    case "offer_received":
      return { icon: TrendingUp, bg: "bg-green-100", color: "text-green-600" };
    case "quote_received":
    case "quote_sent":
      return { icon: TrendingUp, bg: "bg-green-100", color: "text-green-600" };
    case "booking_confirmed":
    case "booking_updated":
      return { icon: Home, bg: "bg-blue-100", color: "text-blue-600" };
    case "milestone_updated":
      return { icon: ShieldAlert, bg: "bg-rose-100", color: "text-rose-600" };
    case "new_message":
      return {
        icon: MessageSquare,
        bg: "bg-muted",
        color: "text-muted-foreground",
      };
    case "review_posted":
      return { icon: Star, bg: "bg-amber-100", color: "text-amber-600" };
    default:
      return { icon: Bell, bg: "bg-muted", color: "text-muted-foreground" };
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
// NotificationRow sub-component
// ---------------------------------------------------------------------------

type NotificationRowProps = Readonly<{
  notification: PlatformEvent;
  isUnread: boolean;
}>;

function NotificationRow({ notification, isUnread }: NotificationRowProps) {
  const iconConfig = getIconConfig(notification.event_type);
  const Icon = iconConfig.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-4 rounded-xl border border-border px-4 py-4 transition-colors",
        isUnread
          ? "bg-brand-primary/5 border-l-4 border-l-brand-primary"
          : "bg-white hover:bg-surface",
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          iconConfig.bg,
        )}
      >
        <Icon className={cn("h-5 w-5", iconConfig.color)} />
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm leading-snug",
            isUnread
              ? "font-semibold text-brand-primary-dark"
              : "text-foreground",
          )}
        >
          {getDescription(notification)}
        </p>
        <p className="mt-1 text-xs text-neutral-400">
          {relativeTime(notification.created_at)}
        </p>
      </div>

      {/* Unread dot */}
      {isUnread && (
        <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-primary" />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pull-to-refresh constants
// ---------------------------------------------------------------------------

const PULL_THRESHOLD = 60;

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

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
    <div className="mx-auto max-w-3xl px-4 py-8 md:py-10">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="mb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400 mb-1">
          Activity &amp; Alerts
        </p>
        <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-brand-primary-dark">
          Notification Centre
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {total} notifications
        </p>
      </div>

      {/* Tabs + Mark-all-read row */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 min-w-0">
        <div className="flex gap-1 border-b border-border">
          {(["all", "unread", "system"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "-mb-px border-b-2 px-4 py-2 text-sm font-medium capitalize transition-colors",
                activeTab === tab
                  ? "border-brand-primary text-brand-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab === "unread"
                ? `Unread (${unreadCount})`
                : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleMarkAllRead}
          disabled={isLoading || markAllRead.isPending}
          className="shrink-0 text-[11px] font-bold uppercase tracking-[0.10em] text-brand-primary hover:text-brand-primary-dark disabled:opacity-50 transition-colors"
        >
          Mark all as read
        </button>
      </div>

      {/* Section eyebrow */}
      <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
        Recent Activity
      </p>

      {/* Pull-to-refresh indicator */}
      {showPullIndicator && (
        <div
          className="flex items-center justify-center py-2 text-muted-foreground text-sm gap-2 overflow-hidden transition-all"
          style={{ height: `${Math.min(pullOffset, PULL_THRESHOLD)}px` }}
          aria-live="polite"
          aria-label={
            isRefreshing
              ? "Refreshing notifications"
              : "Pull to refresh"
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
                className="animate-pulse rounded-xl border border-border p-4"
              >
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <p className="text-sm">No notifications here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <NotificationRow
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
        <div className="mt-6 flex flex-col items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCursor(nextCursor)}
            disabled={isLoading}
            className="text-xs uppercase tracking-[0.10em] font-bold text-muted-foreground hover:text-foreground gap-1"
          >
            Load more
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
