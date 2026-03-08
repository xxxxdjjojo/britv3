"use client";

/**
 * Full-page notification history with mark-all-read action.
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMarkAllRead, useNotificationCount } from "@/hooks/useNotifications";
import NotificationFeed from "@/components/notifications/NotificationFeed";

export default function NotificationsPage() {
  const markAllRead = useMarkAllRead();
  const { data: countData } = useNotificationCount();

  const unreadCount = countData?.count ?? 0;

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          {unreadCount > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">
              {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            Mark all as read
          </Button>
        )}
      </div>
      <Card>
        <CardHeader className="sr-only">
          <CardTitle>Notification Feed</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <NotificationFeed />
        </CardContent>
      </Card>
    </div>
  );
}
