"use client";

/**
 * Activity feed component with cursor-based pagination.
 * Displays recent user activity with "Load more" for additional entries.
 */

import {
  Heart,
  FileText,
  Eye,
  Tag,
  MessageSquare,
  Star,
  Briefcase,
  Bell,
  Activity,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivityLog } from "@/hooks/useDashboard";

// ---------------------------------------------------------------------------
// Event type icon mapping
// ---------------------------------------------------------------------------

const EVENT_ICONS: Record<string, LucideIcon> = {
  property_saved: Heart,
  application_submitted: FileText,
  property_viewed: Eye,
  offer_received: Tag,
  offer_made: Tag,
  message_received: MessageSquare,
  review_posted: Star,
  quote_requested: Briefcase,
  lead_assigned: Bell,
  rent_received: Activity,
};

function getEventIcon(eventType: string): LucideIcon {
  return EVENT_ICONS[eventType] ?? Activity;
}

// ---------------------------------------------------------------------------
// Time ago helper
// ---------------------------------------------------------------------------

function timeAgo(date: Date | string): string {
  const now = new Date();
  const then = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `${diffWeeks}w ago`;

  return then.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

// ---------------------------------------------------------------------------
// ActivityFeed component
// ---------------------------------------------------------------------------

export function ActivityFeed() {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useActivityLog();

  const entries = data?.pages.flatMap((page) => page.entries) ?? [];

  if (isLoading) {
    return <ActivityFeedSkeleton />;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {entries.length === 0 ? (
          <div className="text-muted-foreground px-6 py-8 text-center text-sm">
            No recent activity
          </div>
        ) : (
          <ScrollArea className="max-h-96">
            <div className="flex flex-col">
              {entries.map((entry, i) => {
                const Icon = getEventIcon(entry.event_type);
                return (
                  <div
                    key={`${entry.id}-${i}`}
                    className="flex items-start gap-3 border-b px-6 py-3 last:border-b-0"
                  >
                    <div className="bg-muted mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full">
                      <Icon className="text-muted-foreground size-3.5" />
                    </div>
                    <div className="flex flex-1 flex-col gap-0.5">
                      <p className="text-sm leading-snug">{entry.description}</p>
                      <p className="text-muted-foreground text-xs">
                        {timeAgo(entry.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {/* Load more */}
        {hasNextPage && (
          <div className="border-t p-3">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? "Loading..." : "Load more"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Skeleton loading state
// ---------------------------------------------------------------------------

function ActivityFeedSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-28" />
      </CardHeader>
      <CardContent className="p-0">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-start gap-3 border-b px-6 py-3 last:border-b-0"
          >
            <Skeleton className="size-7 rounded-full" />
            <div className="flex flex-1 flex-col gap-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
