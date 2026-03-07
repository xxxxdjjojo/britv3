"use client";

/**
 * Bell icon with unread count badge. Click opens a popover with recent
 * notifications and a "Mark all read" action.
 */

import { Bell } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotificationCount, useMarkAllRead } from "@/hooks/useNotifications";
import NotificationFeed from "./NotificationFeed";

export default function NotificationBell() {
  const { data: countData } = useNotificationCount();
  const markAllRead = useMarkAllRead();

  const unreadCount = countData?.count ?? 0;

  return (
    <Popover>
      <PopoverTrigger className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-medium text-destructive-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
        <span className="sr-only">
          {unreadCount > 0
            ? `${unreadCount} unread notifications`
            : "Notifications"}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              Mark all read
            </Button>
          )}
        </div>
        <NotificationFeed compact />
        <div className="border-t p-2">
          <Link
            href="/notifications"
            className="block rounded-md px-3 py-2 text-center text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
