"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "@/hooks/useRole";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_NAV_ITEMS, ROLE_PRIMARY_CTA, navLinkClasses } from "@/config/navigation";
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
  CalendarPlus,
} from "lucide-react";
import type { UserRole } from "@/types/auth";
import UnreadBadge from "@/components/messaging/UnreadBadge";

const RETURN_URL_KEY = "britestate-return-url";

const ROLE_LABELS: Record<UserRole, string> = {
  homebuyer: "Homebuyer",
  renter: "Renter",
  seller: "Seller",
  landlord: "Landlord",
  agent: "Estate Agent",
  service_provider: "Service Provider",
  mortgage_broker: "Mortgage Broker",
};

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
        "sticky top-14 hidden h-[calc(100vh-3.5rem)] flex-col self-start overflow-y-auto border-r border-border/60 bg-surface lg:flex transition-all duration-200 ease-out",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Back to Site */}
      <div className={cn("p-2", collapsed && "px-1")}>
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

      {/* Role eyebrow — Stitch "Welcome back / role" block */}
      {!collapsed && activeRole && (
        <div className="px-5 pb-3 pt-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400">
            Welcome back
          </p>
          <p className="font-heading text-lg font-bold text-brand-primary-dark">
            {ROLE_LABELS[activeRole]}
          </p>
        </div>
      )}

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
                <span className="inline-flex items-center justify-center rounded-full bg-red-500 px-1.5 py-0 text-[10px] font-medium text-white">
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

      {/* Primary CTA — Stitch dark-green action pinned above account */}
      {activeRole && (
        <div className={cn("mt-auto p-3", collapsed && "px-2")}>
          <Button
            className={cn(
              "w-full gap-2 bg-brand-primary text-white hover:bg-brand-primary-dark",
              collapsed && "px-0",
            )}
            render={<Link href={ROLE_PRIMARY_CTA[activeRole].href} />}
            title={collapsed ? ROLE_PRIMARY_CTA[activeRole].label : undefined}
          >
            <CalendarPlus className="size-4 shrink-0" />
            {!collapsed && <span>{ROLE_PRIMARY_CTA[activeRole].label}</span>}
          </Button>
        </div>
      )}

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
