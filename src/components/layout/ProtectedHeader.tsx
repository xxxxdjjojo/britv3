"use client";

import Link from "next/link";
import { Mail } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import NotificationBell from "@/components/notifications/NotificationBell";
import UnreadBadge from "@/components/messaging/UnreadBadge";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { cn } from "@/lib/utils";

export function ProtectedHeader() {
  const scrollDirection = useScrollDirection();
  const { isMobile, isTablet } = useBreakpoint();
  const shouldAutoHide = (isMobile || isTablet) && scrollDirection === "down";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur-sm transition-transform duration-200",
        shouldAutoHide && "-translate-y-full",
      )}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo size="sm" />

        <div className="flex items-center gap-2">
          <Link
            href="/inbox"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Inbox"
          >
            <Mail className="h-5 w-5" />
            <span className="absolute -right-1 -top-1">
              <UnreadBadge />
            </span>
          </Link>

          <NotificationBell />
        </div>
      </div>
    </header>
  );
}
