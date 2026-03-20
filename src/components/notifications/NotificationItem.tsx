"use client";

/**
 * Single notification item with icon, actor, description, and time ago.
 * Click navigates to the relevant page based on entity type.
 */

import Link from "next/link";
import {
  MessageSquare,
  FileText,
  Calendar,
  Flag,
  Star,
  Eye,
  Package,
  Bell,
} from "lucide-react";
import type { PlatformEvent, EventType } from "@/types/notifications";

type NotificationItemProps = Readonly<{
  event: PlatformEvent;
  lastReadAt: string | null;
}>;

// ---------------------------------------------------------------------------
// Icon mapping
// ---------------------------------------------------------------------------

const EVENT_ICONS: Record<EventType, typeof Bell> = {
  new_message: MessageSquare,
  quote_received: FileText,
  quote_sent: FileText,
  booking_confirmed: Calendar,
  booking_updated: Calendar,
  milestone_updated: Flag,
  offer_received: Package,
  viewing_scheduled: Eye,
  review_posted: Star,
};

// ---------------------------------------------------------------------------
// Action description
// ---------------------------------------------------------------------------

function getActionDescription(event: PlatformEvent): string {
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

// ---------------------------------------------------------------------------
// Navigation URL
// ---------------------------------------------------------------------------

function getNotificationUrl(event: PlatformEvent): string {
  switch (event.entity_type) {
    case "conversation":
      return `/inbox/${event.entity_id}`;
    case "booking":
      return `/bookings/${event.entity_id}`;
    case "listing":
      return `/listings/${event.entity_id}`;
    case "rfq":
      return `/quotes/${event.entity_id}`;
    case "transaction":
      return `/transactions/${event.entity_id}`;
    default:
      return "/notifications";
  }
}

// ---------------------------------------------------------------------------
// Time ago
// ---------------------------------------------------------------------------

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NotificationItem({
  event,
  lastReadAt,
}: NotificationItemProps) {
  const Icon = EVENT_ICONS[event.event_type] ?? Bell;
  const isUnread = lastReadAt
    ? new Date(event.created_at) > new Date(lastReadAt)
    : true;
  const url = getNotificationUrl(event);

  return (
    <Link
      href={url}
      className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50 ${
        isUnread ? "bg-primary/5" : ""
      }`}
    >
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUnread ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm ${
            isUnread ? "font-medium text-foreground" : "text-muted-foreground"
          }`}
        >
          {getActionDescription(event)}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {timeAgo(new Date(event.created_at))}
        </p>
      </div>
      {isUnread && (
        <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
      )}
    </Link>
  );
}
