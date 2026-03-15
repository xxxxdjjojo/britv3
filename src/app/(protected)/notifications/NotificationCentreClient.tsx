"use client";

/**
 * Notification Centre page — tabbed view with All, Unread, and System tabs.
 * Mark-all-read action. Cursor-based load-more pagination.
 */

import { useState } from "react";
import {
  Bell,
  Home,
  TrendingUp,
  Calendar,
  ShieldAlert,
  MessageSquare,
  Star,
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
        bg: "bg-slate-100",
        color: "text-slate-600",
      };
    case "review_posted":
      return { icon: Star, bg: "bg-amber-100", color: "text-amber-600" };
    default:
      return { icon: Bell, bg: "bg-slate-100", color: "text-slate-600" };
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
        "rounded-xl border bg-card p-4",
        isUnread && "border-l-4 border-l-primary",
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
          <p className={cn("text-sm", isUnread && "font-semibold")}>
            {getDescription(notification)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {relativeTime(notification.created_at)}
          </p>
        </div>
        {isUnread && (
          <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function NotificationCentreClient() {
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  const { data, isLoading } = useNotifications(cursor);
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notification Centre</h1>
          <p className="text-sm text-muted-foreground">{total} notifications</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkAllRead}
          disabled={isLoading || markAllRead.isPending}
        >
          Mark all as read
        </Button>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b">
        {(["all", "unread", "system"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 text-sm font-medium capitalize transition-colors",
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab === "unread"
              ? `Unread (${unreadCount})`
              : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Notification list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border p-4">
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
            <NotificationCard
              key={notification.id}
              notification={notification}
              isUnread={isUnread(notification)}
            />
          ))}
        </div>
      )}

      {/* Load more */}
      {nextCursor && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCursor(nextCursor)}
            disabled={isLoading}
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
