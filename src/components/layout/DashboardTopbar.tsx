"use client";

import Link from "next/link";
import { Bell, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import UnreadBadge from "@/components/messaging/UnreadBadge";

/**
 * Dashboard top bar — Stitch design parity.
 * Sticky, translucent header: Britestate wordmark (left), notification + inbox
 * icons and account avatar (right). Sits above the sidebar + content.
 */
export function DashboardTopbar() {
  const { user } = useAuth();
  const displayName = user?.user_metadata?.display_name ?? user?.email ?? "User";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border/60 bg-white/80 px-4 backdrop-blur-md md:px-8 dark:bg-neutral-950/80">
      {/* Wordmark */}
      <Link
        href="/"
        className="font-heading text-lg font-bold tracking-tight text-brand-primary-dark dark:text-brand-primary-lighter"
      >
        Britestate
      </Link>

      {/* Actions */}
      <div className="flex items-center gap-1 sm:gap-2">
        <Link
          href="/notifications"
          aria-label="Notifications"
          className="flex size-9 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
        >
          <Bell className="size-5" />
        </Link>

        <Link
          href="/inbox"
          aria-label="Messages"
          className="relative flex size-9 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
        >
          <Mail className="size-5" />
          <span className="absolute right-1 top-1">
            <UnreadBadge />
          </span>
        </Link>

        <Link
          href="/settings"
          aria-label="Account settings"
          className="ml-1 flex items-center rounded-full ring-offset-2 transition hover:ring-2 hover:ring-brand-primary/30"
        >
          <Avatar size="sm">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
}
