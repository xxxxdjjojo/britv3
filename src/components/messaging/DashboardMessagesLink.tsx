"use client";

/**
 * DashboardMessagesLink -- the shared "Messages" entry point dropped onto every
 * role dashboard. Links to the canonical inbox (`/inbox`) and shows a live
 * unread-count badge (brand-green, hidden at 0) driven by useUnreadCount().
 *
 * `variant` adapts the chrome to each dashboard's existing card/nav pattern:
 *   - "button"  : an outline button row (Quick-Actions style)
 *   - "panel"   : a full-width link row for dark InsightPanel surfaces
 *   - "icon"    : a compact icon button for dashboard headers
 */

import Link from "next/link";
import { Mail } from "lucide-react";
import { useUnreadCount } from "@/hooks/useInbox";
import { cn } from "@/lib/utils";

type Variant = "button" | "panel" | "icon";

function useUnread(): number {
  const { data } = useUnreadCount();
  return data?.count ?? 0;
}

/** Brand-green count pill. Renders nothing at 0 so the 0-state stays clean. */
function CountPill({
  count,
  tone = "brand",
  className,
}: Readonly<{ count: number; tone?: "brand" | "onDark"; className?: string }>) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums",
        tone === "brand"
          ? "bg-brand-primary text-white"
          : "bg-white text-brand-primary-dark",
        className,
      )}
      aria-hidden="true"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function DashboardMessagesLink({
  variant = "button",
  className,
}: Readonly<{ variant?: Variant; className?: string }>) {
  const count = useUnread();
  const label =
    count > 0 ? `Messages, ${count} unread` : "Messages";

  if (variant === "icon") {
    return (
      <Link
        href="/inbox"
        aria-label={label}
        className={cn(
          "relative inline-flex size-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-brand-primary/30 hover:text-brand-primary",
          className,
        )}
      >
        <Mail className="size-5" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1">
            <CountPill count={count} />
          </span>
        )}
      </Link>
    );
  }

  if (variant === "panel") {
    return (
      <Link
        href="/inbox"
        aria-label={label}
        className={cn(
          "flex items-center gap-3 rounded-lg bg-white/10 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/20",
          className,
        )}
      >
        <Mail className="size-4 text-brand-gold" />
        <span className="flex-1">Messages</span>
        <CountPill count={count} tone="onDark" />
      </Link>
    );
  }

  // "button" — outline button row matching Quick-Actions buttons.
  return (
    <Link
      href="/inbox"
      aria-label={label}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-brand-primary/30 hover:bg-brand-primary-lighter hover:text-brand-primary-dark",
        className,
      )}
    >
      <Mail className="size-4" />
      <span>Messages</span>
      <CountPill count={count} className="ml-0.5" />
    </Link>
  );
}
