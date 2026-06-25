"use client";

/**
 * NotificationBadge -- shows the unread notification count on the sidebar
 * Notifications nav item. Renders nothing when the count is 0.
 */

import { useNotificationCount } from "@/hooks/useNotifications";
import { Badge } from "@/components/ui/badge";

export default function NotificationBadge() {
  const { data } = useNotificationCount();
  const count = data?.count ?? 0;

  if (count === 0) return null;

  return (
    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
      {count > 99 ? "99+" : count}
    </Badge>
  );
}
