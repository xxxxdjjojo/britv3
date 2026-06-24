"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Mail,
  CircleUserRound,
  Settings,
  CircleHelp,
  LogOut,
} from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import NotificationBell from "@/components/notifications/NotificationBell";
import UnreadBadge from "@/components/messaging/UnreadBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { cn } from "@/lib/utils";

export function ProtectedHeader() {
  const scrollDirection = useScrollDirection();
  const { isMobile, isTablet } = useBreakpoint();
  const { user, signOut } = useAuth();
  const shouldAutoHide = (isMobile || isTablet) && scrollDirection === "down";

  // Open the profile menu on hover (desktop) while keeping click/tap + keyboard working
  // via Base UI's onOpenChange. A short close delay bridges the gap to the popup.
  const [menuOpen, setMenuOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const openMenu = () => {
    cancelClose();
    setMenuOpen(true);
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setMenuOpen(false), 160);
  };
  useEffect(() => cancelClose, []);

  // Hover-to-open only on devices that actually hover. On touch, tap/click drives
  // the menu via Base UI (a synthetic hover on first tap would otherwise open-then-close).
  const hoverProps =
    isMobile || isTablet
      ? {}
      : { onMouseEnter: openMenu, onMouseLeave: scheduleClose };

  const handleLogout = async () => {
    await signOut();
    // Full navigation so middleware re-evaluates auth and cached RSC payloads are dropped.
    window.location.href = "/login";
  };

  const displayName = user?.user_metadata?.display_name ?? user?.email ?? "User";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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

          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen} modal={false}>
            <DropdownMenuTrigger
              aria-label="Open profile menu"
              className="ml-1 flex items-center rounded-full outline-none transition hover:ring-2 hover:ring-brand-primary/30 focus-visible:ring-2 focus-visible:ring-brand-primary/40"
              {...hoverProps}
            >
              <Avatar size="sm">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={6}
              className="min-w-48"
              {...hoverProps}
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="truncate">{displayName}</DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/profile" />}>
                <CircleUserRound />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/settings" />}>
                <Settings />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/help" />}>
                <CircleHelp />
                Help
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                <LogOut />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
