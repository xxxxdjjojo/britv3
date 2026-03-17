"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserCircle,
  ShieldCheck,
  Inbox,
  GitBranch,
  PackageSearch,
  Calculator,
  Star,
  BarChart3,
  Crown,
  Menu,
  Building2,
} from "lucide-react";
import React from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger as SheetTriggerBase,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const SheetTrigger = SheetTriggerBase as React.ComponentType<{ asChild?: boolean; children: React.ReactNode }>;

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
      { label: "Dashboard", href: "/dashboard/broker", icon: LayoutDashboard },
    ],
  },
  {
    label: "Profile & Trust",
    items: [
      { label: "Profile", href: "/dashboard/broker/profile", icon: UserCircle },
      { label: "FCA Verification", href: "/dashboard/broker/fca-verification", icon: ShieldCheck },
    ],
  },
  {
    label: "Clients",
    items: [
      { label: "Leads", href: "/dashboard/broker/leads", icon: Inbox },
      { label: "Client Pipeline", href: "/dashboard/broker/pipeline", icon: GitBranch },
    ],
  },
  {
    label: "Tools",
    items: [
      { label: "Products", href: "/dashboard/broker/products", icon: PackageSearch },
      { label: "Calculator Tools", href: "/dashboard/broker/calculators", icon: Calculator },
    ],
  },
  {
    label: "Growth",
    items: [
      { label: "Reviews", href: "/dashboard/broker/reviews", icon: Star },
      { label: "Analytics", href: "/dashboard/broker/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Billing", href: "/dashboard/broker/billing", icon: Crown },
    ],
  },
];

function NavLink(props: Readonly<{ item: NavItem; pathname: string }>) {
  const { item, pathname } = props;
  const Icon = item.icon;

  const isActive =
    item.href === "/dashboard/broker"
      ? pathname === "/dashboard/broker"
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
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#1B4D3E] dark:text-white">BRITESTATE</h1>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Mortgage Broker</p>
        </div>
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

export function BrokerSidebar() {
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
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Open navigation menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0" showCloseButton={true}>
            <SidebarInner pathname={pathname} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
