"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserCircle,
  ShieldCheck,
  Wrench,
  MapPin,
  Calendar,
  Inbox,
  Briefcase,
  CheckCircle,
  FileText,
  Receipt,
  CreditCard,
  Image,
  Star,
  BarChart3,
  Crown,
  Rocket,
  Users,
  Menu,
  Building2,
} from "lucide-react";
import React from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard Home", href: "/dashboard/provider", icon: LayoutDashboard },
    ],
  },
  {
    label: "Profile & Trust",
    items: [
      { label: "My Profile", href: "/dashboard/provider/profile", icon: UserCircle },
      { label: "Verification", href: "/dashboard/provider/verification", icon: ShieldCheck },
    ],
  },
  {
    label: "Services",
    items: [
      { label: "Manage Services", href: "/dashboard/provider/services", icon: Wrench },
      { label: "Service Areas", href: "/dashboard/provider/services/areas", icon: MapPin },
      { label: "Availability", href: "/dashboard/provider/availability", icon: Calendar },
    ],
  },
  {
    label: "Jobs",
    items: [
      { label: "New Leads", href: "/dashboard/provider/jobs/leads", icon: Inbox },
      { label: "Active Jobs", href: "/dashboard/provider/jobs/active", icon: Briefcase },
      { label: "Completed Jobs", href: "/dashboard/provider/jobs/completed", icon: CheckCircle },
    ],
  },
  {
    label: "Financial",
    items: [
      { label: "Quote Builder", href: "/dashboard/provider/quotes/builder", icon: FileText },
      { label: "Invoices", href: "/dashboard/provider/quotes", icon: Receipt },
      { label: "Payments", href: "/dashboard/provider/payments", icon: CreditCard },
    ],
  },
  {
    label: "Growth",
    items: [
      { label: "Portfolio", href: "/dashboard/provider/portfolio", icon: Image },
      { label: "Reviews", href: "/dashboard/provider/reviews", icon: Star },
      { label: "Analytics", href: "/dashboard/provider/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Subscription", href: "/dashboard/provider/billing", icon: Crown },
      { label: "Boost Profile", href: "/dashboard/provider/boost", icon: Rocket },
      { label: "Referral Programme", href: "/dashboard/provider/referrals", icon: Users },
    ],
  },
];

function NavLink(props: Readonly<{ item: NavItem; pathname: string }>) {
  const { item, pathname } = props;
  const Icon = item.icon;

  // Exact match for dashboard home; prefix match for sub-sections
  const isActive =
    item.href === "/dashboard/provider"
      ? pathname === "/dashboard/provider"
      : pathname === item.href || pathname.startsWith(item.href + "/");

  return (
    <Link
      href={item.href}
      className={
        isActive
          ? "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold bg-[#E8F5EE] text-[#1B4D3E] dark:bg-[#1B4D3E] dark:text-white"
          : "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 transition-colors hover:bg-neutral-100 dark:hover:bg-[#1B4D3E]/20"
      }
    >
      <Icon className="size-4 shrink-0" />
      <span>{item.label}</span>
    </Link>
  );
}

function SidebarInner(props: Readonly<{ pathname: string }>) {
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-white dark:bg-[#152C22]">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b p-6">
        <div className="flex size-8 items-center justify-center rounded-lg bg-[#1B4D3E] text-white">
          <Building2 className="size-5" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-[#1B4D3E] dark:text-white">BRITESTATE</h1>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 space-y-4 p-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink key={item.href} item={item} pathname={props.pathname} />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}

export function ProviderSidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop permanent sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r bg-white dark:bg-[#152C22] lg:block">
        <SidebarInner pathname={pathname} />
      </aside>

      {/* Mobile hamburger + sheet drawer */}
      <div className="fixed left-4 top-4 z-50 lg:hidden">
        <Sheet>
          <SheetTrigger
            className="inline-flex size-10 items-center justify-center rounded-md border bg-background text-foreground shadow-sm hover:bg-accent"
            aria-label="Open navigation menu"
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0" showCloseButton={true}>
            <SidebarInner pathname={pathname} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
