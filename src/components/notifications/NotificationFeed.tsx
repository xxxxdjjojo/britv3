"use client";

/**
 * Notification feed list. Supports compact mode (popover, max 5) and
 * full page mode with cursor-based "Load more".
 */

import { useEffect, useRef, useState } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import NotificationItem from "./NotificationItem";

type NotificationFeedProps = Readonly<{
  compact?: boolean;
}>;

export default function NotificationFeed({
  compact = false,
}: NotificationFeedProps) {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const { data, isLoading, error } = useNotifications(
    compact ? undefined : cursor,
  );

  const notifications = data?.notifications ?? [];
  const displayItems = compact ? notifications.slice(0, 5) : notifications;

  // Track new notifications for screen reader announcement
  const prevCountRef = useRef(displayItems.length);
  const [liveAnnouncement, setLiveAnnouncement] = useState("");

  useEffect(() => {
    const newCount = displayItems.length - prevCountRef.current;
    if (newCount > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- accessibility announcement; needs to fire when the notification list changes
      setLiveAnnouncement(
        newCount === 1
          ? "1 new notification"
          : `${newCount} new notifications`,
      );
    }
    prevCountRef.current = displayItems.length;
  }, [displayItems.length]);

  if (isLoading) {
    return (
      <div className="space-y-1 p-2">
        {Array.from({ length: compact ? 3 : 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-8 text-center text-sm text-muted-foreground">
        Failed to load notifications.
      </div>
    );
  }

  if (displayItems.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm text-muted-foreground">
        You&apos;re all caught up!
      </div>
    );
  }

  return (
    <div>
      <div className="divide-y">
        {displayItems.map((event) => (
          <NotificationItem
            key={event.id}
            event={event}
            lastReadAt={data?.lastReadAt ?? null}
          />
        ))}
      </div>
      {/* Announce only NEW notifications to screen readers */}
      <div aria-live="polite" className="sr-only">
        {liveAnnouncement}
      </div>

      {/* Load more for full page mode */}
      {!compact && data?.nextCursor && (
        <div className="p-4 text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCursor(data.nextCursor ?? undefined)}
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
