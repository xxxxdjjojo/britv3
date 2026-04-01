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
          ? "flex items-center gap-3 px-4 py-2 font-heading text-sm font-bold transition-all border-r-4 border-brand-primary-dark text-brand-primary-dark"
          : "flex items-center gap-3 px-4 py-2 font-heading text-sm transition-all text-brand-primary/60 hover:text-brand-primary hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-50"
      }
    >
      <Icon className="size-4 shrink-0" />
      <span>{item.label}</span>
    </Link>
  );
}

function SidebarInner(props: Readonly<{ pathname: string }>) {
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-neutral-50 dark:bg-neutral-900">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-neutral-200/60 dark:border-neutral-700/60 px-5 py-5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-brand-primary text-white">
          <Building2 className="size-5" />
        </div>
        <div>
          <h1 className="font-heading text-base font-semibold tracking-tight text-foreground">BRITESTATE</h1>
          <p className="font-body text-[10px] font-bold uppercase tracking-widest text-brand-primary/60">Mortgage Portal</p>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 space-y-4 p-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="font-body text-xs font-medium uppercase tracking-wider text-neutral-400 px-3 mb-1">
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
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-neutral-50 border-r border-neutral-200/60 dark:bg-neutral-900 dark:border-neutral-700/60 lg:block">
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
          <SheetContent side="left" className="w-64 p-0 bg-neutral-50 dark:bg-neutral-900" showCloseButton={true}>
            <SidebarInner pathname={pathname} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
