"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "@/hooks/useRole";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_NAV_ITEMS, navLinkClasses } from "@/config/navigation";
import { RoleSwitcher } from "@/components/layout/RoleSwitcher";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Mail,
  Bell,
  User,
} from "lucide-react";
import UnreadBadge from "@/components/messaging/UnreadBadge";

const RETURN_URL_KEY = "britestate-return-url";

function getReturnUrl(): string {
  if (typeof window === "undefined") return "/";
  const stored = sessionStorage.getItem(RETURN_URL_KEY);
  if (stored) return stored;
  if (document.referrer) {
    try {
      const referrerUrl = new URL(document.referrer);
      if (
        referrerUrl.origin === window.location.origin &&
        !referrerUrl.pathname.startsWith("/dashboard")
      ) {
        sessionStorage.setItem(RETURN_URL_KEY, referrerUrl.pathname);
        return referrerUrl.pathname;
      }
    } catch {
      // Invalid referrer URL, keep fallback
    }
  }
  return "/";
}

export function Sidebar() {
  const { activeRole } = useRole();
  const { user } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [returnUrl] = useState(getReturnUrl);

  const navItems = activeRole ? ROLE_NAV_ITEMS[activeRole] ?? [] : [];
  const displayName = user?.user_metadata?.display_name ?? user?.email ?? "User";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Notification count — hardcoded to 0 for now, will be connected to real data later
  const notificationCount = 0;

  return (
    <aside
      className={cn(
        "hidden flex-col border-r bg-white lg:flex transition-all duration-200 ease-out",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Back to Site */}
      <div className={cn("border-b p-2", collapsed && "px-1")}>
        <Link
          href={returnUrl}
          className={cn(
            navLinkClasses({ variant: "sidebar" }),
            collapsed && "justify-center px-2",
          )}
          title="Back to Site"
        >
          <ArrowLeft className="size-5 shrink-0" />
          {!collapsed && <span>Back to Site</span>}
        </Link>
      </div>

      {/* Role Switcher */}
      <div className={cn("border-b p-2", collapsed && "px-1")}>
        {collapsed ? (
          <div className="flex justify-center py-2">
            <div className="size-8 rounded-lg bg-brand-primary/10" />
          </div>
        ) : (
          <RoleSwitcher />
        )}
      </div>

      {/* Navigation — Manage section */}
      <nav className="flex-1 space-y-1 p-2" aria-label="Dashboard navigation">
        {!collapsed && (
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 px-3 mt-4 mb-1">
            Manage
          </h3>
        )}
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                navLinkClasses({ variant: "sidebar", active: isActive }),
                collapsed && "justify-center px-2",
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="size-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Communicate section */}
      <nav className="space-y-1 border-t p-2" aria-label="Communication">
        {!collapsed && (
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 px-3 mt-4 mb-1">
            Communicate
          </h3>
        )}
        <Link
          href="/inbox"
          className={cn(
            navLinkClasses({
              variant: "sidebar",
              active: pathname === "/inbox" || pathname.startsWith("/inbox/"),
            }),
            collapsed && "justify-center px-2",
          )}
          title={collapsed ? "Inbox" : undefined}
        >
          <Mail className="size-5 shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1">Inbox</span>
              <UnreadBadge />
            </>
          )}
        </Link>
        <Link
          href="/notifications"
          className={cn(
            navLinkClasses({
              variant: "sidebar",
              active: pathname === "/notifications",
            }),
            collapsed && "justify-center px-2",
          )}
          title={collapsed ? "Notifications" : undefined}
        >
          <Bell className="size-5 shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1">Notifications</span>
              {notificationCount > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-error px-1.5 py-0 text-[10px] font-medium text-white">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </>
          )}
        </Link>
      </nav>

      {/* Account section */}
      <nav className="space-y-1 border-t p-2" aria-label="Account">
        {!collapsed && (
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 px-3 mt-4 mb-1">
            Account
          </h3>
        )}
        <Link
          href="/profile"
          className={cn(
            navLinkClasses({
              variant: "sidebar",
              active: pathname === "/profile" || pathname.startsWith("/profile/"),
            }),
            collapsed && "justify-center px-2",
          )}
          title={collapsed ? "Profile" : undefined}
        >
          <User className="size-5 shrink-0" />
          {!collapsed && <span>Profile</span>}
        </Link>
      </nav>

      {/* Collapse toggle */}
      <div className="border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          className={cn("w-full", collapsed ? "justify-center" : "justify-start")}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <>
              <PanelLeftClose className="size-4" />
              <span className="ml-2">Collapse</span>
            </>
          )}
        </Button>
      </div>

      {/* User Info */}
      <div className={cn("border-t p-3", collapsed && "px-1")}>
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-neutral-100",
            collapsed && "justify-center px-0",
          )}
        >
          <Avatar size="sm">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 truncate">
              <p className="truncate text-sm font-medium text-neutral-900">
                {displayName}
              </p>
            </div>
          )}
          {!collapsed && <Settings className="size-4 text-neutral-400" />}
        </Link>
      </div>
    </aside>
  );
}
