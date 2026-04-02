"use client";

/**
 * UnreadBadge -- shows unread conversation count on the inbox nav item.
 * Renders nothing if count is 0.
 */

import { useUnreadCount } from "@/hooks/useInbox";

export default function UnreadBadge() {
  const { data } = useUnreadCount();
  const count = data?.count ?? 0;

  if (count === 0) return null;

  return (
    <span className="ml-1 rounded-full bg-brand-primary px-2 py-0.5 text-[10px] font-bold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}
