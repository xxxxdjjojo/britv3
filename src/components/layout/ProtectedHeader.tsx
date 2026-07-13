"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Mail,
  CircleUserRound,
  Settings,
  CircleHelp,
  LogOut,
  ShieldCheck,
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
import { hasConfiguredAdminAccess } from "@/lib/auth/admin-access";
import { cn } from "@/lib/utils";

export function ProtectedHeader() {
  const scrollDirection = useScrollDirection();
  const { isMobile, isTablet } = useBreakpoint();
  const { user, signOut } = useAuth();
  const [canAccessAdmin, setCanAccessAdmin] = useState(false);
  const shouldAutoHide = (isMobile || isTablet) && scrollDirection === "down";

  useEffect(() => {
    let cancelled = false;

    async function loadAdminAccess() {
      if (!user) {
        setCanAccessAdmin(false);
        return;
      }

      try {
        const response = await fetch("/api/profile", { cache: "no-store" });
        if (!response.ok) {
          if (!cancelled) setCanAccessAdmin(false);
          return;
        }

        const body = await response.json() as {
          data?: {
            is_admin?: boolean | null;
            admin_role?: string | null;
          };
        };

        if (!cancelled) {
          setCanAccessAdmin(
            hasConfiguredAdminAccess({
              is_admin: body.data?.is_admin ?? false,
              admin_role: body.data?.admin_role ?? null,
            }),
          );
        }
      } catch {
        if (!cancelled) setCanAccessAdmin(false);
      }
    }

    void loadAdminAccess();

    return () => {
      cancelled = true;
    };
  }, [user]);

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
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Inbox"
          >
            <Mail className="h-5 w-5" />
            <span className="absolute -right-1 -top-1">
              <UnreadBadge />
            </span>
          </Link>

          <NotificationBell />

          {/* Uncontrolled: Base UI owns the open state so press and keyboard both
              flow through one state machine. The previous version made this
              controlled AND added a hand-rolled onMouseEnter open + onMouseLeave
              close; because a desktop click always fires mouseenter first, the
              hover opened the menu and Base UI's trigger press then toggled it
              shut — so clicking the avatar never opened anything. */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger
              aria-label="Open profile menu"
              className="ml-1 flex min-h-11 min-w-11 items-center justify-center rounded-full outline-none transition hover:ring-2 hover:ring-brand-primary/30 focus-visible:ring-2 focus-visible:ring-brand-primary/40"
            >
              <Avatar size="sm">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={6} className="min-w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="truncate">{displayName}</DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              {canAccessAdmin && (
                <DropdownMenuItem render={<Link href="/admin" />}>
                  <ShieldCheck />
                  Admin Console
                </DropdownMenuItem>
              )}
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
