"use client";

/**
 * UnreadBadge -- shows unread conversation count on the inbox nav item.
 * Renders nothing if count is 0.
 */

import { useUnreadCount } from "@/hooks/useInbox";
import { Badge } from "@/components/ui/badge";

export default function UnreadBadge() {
  const { data } = useUnreadCount();
  const count = data?.count ?? 0;

  if (count === 0) return null;

  return (
    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
      {count > 99 ? "99+" : count}
    </Badge>
  );
}
