"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/types/auth";
import { useRole } from "@/hooks/useRole";
import { useAuth } from "@/hooks/useAuth";
import { RoleSwitcher } from "@/components/layout/RoleSwitcher";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Heart,
  Search,
  Eye,
  FileText,
  Home,
  ClipboardList,
  Building,
  Users,
  Wrench as WrenchIcon,
  PoundSterling,
  Shield,
  Tag,
  TrendingUp,
  Star,
  BadgeCheck,
  Briefcase,
  UserPlus,
  MessagesSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
} from "lucide-react";

type NavItem = Readonly<{
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}>;

const ROLE_NAV_ITEMS: Record<UserRole, NavItem[]> = {
  homebuyer: [
    { href: "/dashboard/homebuyer", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/homebuyer/saved", label: "Saved Properties", icon: Heart },
    { href: "/dashboard/homebuyer/searches", label: "Searches", icon: Search },
    { href: "/dashboard/homebuyer/viewings", label: "Viewings", icon: Eye },
    { href: "/dashboard/homebuyer/documents", label: "Documents", icon: FileText },
  ],
  renter: [
    { href: "/dashboard/renter", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/renter/saved", label: "Saved Rentals", icon: Heart },
    { href: "/dashboard/renter/applications", label: "Applications", icon: ClipboardList },
    { href: "/dashboard/renter/tenancy", label: "Tenancy", icon: Home },
    { href: "/dashboard/renter/documents", label: "Documents", icon: FileText },
  ],
  seller: [
    { href: "/dashboard/seller", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/seller/listings", label: "My Listings", icon: Tag },
    { href: "/dashboard/seller/viewings", label: "Viewings", icon: Eye },
    { href: "/dashboard/seller/offers", label: "Offers", icon: PoundSterling },
    { href: "/dashboard/seller/documents", label: "Documents", icon: FileText },
  ],
  landlord: [
    { href: "/dashboard/landlord", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/landlord/portfolio", label: "Portfolio", icon: Building },
    { href: "/dashboard/landlord/tenants", label: "Tenants", icon: Users },
    { href: "/dashboard/landlord/maintenance", label: "Maintenance", icon: WrenchIcon },
    { href: "/dashboard/landlord/finances", label: "Finances", icon: PoundSterling },
    { href: "/dashboard/landlord/compliance", label: "Compliance", icon: Shield },
  ],
  agent: [
    { href: "/dashboard/agent", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/agent/listings", label: "Listings", icon: Building },
    { href: "/dashboard/agent/leads", label: "Leads", icon: UserPlus },
    { href: "/dashboard/agent/viewings", label: "Viewings", icon: Eye },
    { href: "/dashboard/agent/revenue", label: "Revenue", icon: TrendingUp },
    { href: "/dashboard/agent/team", label: "Team", icon: Briefcase },
  ],
  service_provider: [
    { href: "/dashboard/service_provider", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/service_provider/jobs", label: "Jobs", icon: ClipboardList },
    { href: "/dashboard/service_provider/quotes", label: "Quotes", icon: MessagesSquare },
    { href: "/dashboard/service_provider/reviews", label: "Reviews", icon: Star },
    { href: "/dashboard/service_provider/verification", label: "Verification", icon: BadgeCheck },
    { href: "/dashboard/service_provider/earnings", label: "Earnings", icon: PoundSterling },
  ],
};

export function Sidebar() {
  const { activeRole } = useRole();
  const { user } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = activeRole ? ROLE_NAV_ITEMS[activeRole] ?? [] : [];
  const displayName = user?.user_metadata?.display_name ?? user?.email ?? "User";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside
      className={cn(
        "hidden flex-col border-r bg-white transition-all lg:flex",
        collapsed ? "w-16" : "w-64",
      )}
    >
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

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2" aria-label="Dashboard navigation">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-primary/10 text-brand-primary"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
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
