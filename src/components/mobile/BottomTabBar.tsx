"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Heart,
  Calendar,
  MessageSquare,
  User,
  FileText,
  Home,
  Building2,
  Users,
  Wrench,
  Briefcase,
  ClipboardList,
} from "lucide-react";
import { useRole } from "@/hooks/useRole";
import type { UserRole } from "@/types/auth";

// ---------------------------------------------------------------------------
// Tab configuration per role
// ---------------------------------------------------------------------------

type TabItem = Readonly<{
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}>;

const TAB_CONFIG: Record<UserRole, TabItem[]> = {
  homebuyer: [
    { label: "Search", href: "/search", icon: Search },
    { label: "Saved", href: "/dashboard/homebuyer/saved", icon: Heart },
    { label: "Viewings", href: "/dashboard/homebuyer/viewings", icon: Calendar },
    { label: "Messages", href: "/messages", icon: MessageSquare },
    { label: "Profile", href: "/profile", icon: User },
  ],
  renter: [
    { label: "Search", href: "/search", icon: Search },
    { label: "Saved", href: "/dashboard/renter/saved", icon: Heart },
    { label: "Applications", href: "/dashboard/renter/applications", icon: FileText },
    { label: "Messages", href: "/messages", icon: MessageSquare },
    { label: "Profile", href: "/profile", icon: User },
  ],
  seller: [
    { label: "Listings", href: "/dashboard/seller/listings", icon: Home },
    { label: "Viewings", href: "/dashboard/seller/viewings", icon: Calendar },
    { label: "Offers", href: "/dashboard/seller/offers", icon: FileText },
    { label: "Messages", href: "/messages", icon: MessageSquare },
    { label: "Profile", href: "/profile", icon: User },
  ],
  landlord: [
    { label: "Portfolio", href: "/dashboard/landlord/portfolio", icon: Building2 },
    { label: "Tenants", href: "/dashboard/landlord/tenants", icon: Users },
    { label: "Maintenance", href: "/dashboard/landlord/maintenance", icon: Wrench },
    { label: "Messages", href: "/messages", icon: MessageSquare },
    { label: "Profile", href: "/profile", icon: User },
  ],
  agent: [
    { label: "Listings", href: "/dashboard/agent/listings", icon: Home },
    { label: "Leads", href: "/dashboard/agent/leads", icon: Users },
    { label: "Viewings", href: "/dashboard/agent/viewings", icon: Calendar },
    { label: "Messages", href: "/messages", icon: MessageSquare },
    { label: "Profile", href: "/profile", icon: User },
  ],
  service_provider: [
    { label: "Jobs", href: "/dashboard/provider/jobs", icon: Briefcase },
    { label: "Quotes", href: "/dashboard/provider/quotes", icon: ClipboardList },
    { label: "Calendar", href: "/dashboard/provider/calendar", icon: Calendar },
    { label: "Messages", href: "/messages", icon: MessageSquare },
    { label: "Profile", href: "/profile", icon: User },
  ],
  mortgage_broker: [
    { label: "Cases", href: "/dashboard/mortgage_broker/cases", icon: Briefcase },
    { label: "Clients", href: "/dashboard/mortgage_broker/clients", icon: Users },
    { label: "Messages", href: "/messages", icon: MessageSquare },
    { label: "Profile", href: "/profile", icon: User },
  ],
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BottomTabBar() {
  const pathname = usePathname();
  const { activeRole } = useRole();

  if (!activeRole) return null;

  const tabs = TAB_CONFIG[activeRole];

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-neutral-200 bg-white pb-safe md:hidden"
    >
      {tabs.map((tab) => {
        const isActive =
          tab.href === "/"
            ? pathname === tab.href
            : pathname.startsWith(tab.href);
        const Icon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium transition-colors ${
              isActive
                ? "text-brand-primary"
                : "text-neutral-500 hover:text-neutral-900"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon
              size={20}
              className={isActive ? "text-brand-primary" : "text-neutral-400"}
            />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
