"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  Banknote,
  ShieldCheck,
  Wrench,
  TrendingUp,
  FolderOpen,
  Scale,
  Calculator,
  BarChart3,
  Handshake,
  Shield,
  Grid3X3,
  Menu,
} from "lucide-react";
import React from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger as SheetTriggerBase,
} from "@/components/ui/sheet";

const SheetTrigger = SheetTriggerBase as React.ComponentType<{ asChild?: boolean; children: React.ReactNode }>;

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const BASE_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard/landlord", icon: LayoutDashboard },
  { label: "Properties", href: "/dashboard/landlord/properties", icon: Building2 },
  { label: "Tenants", href: "/dashboard/landlord/tenants", icon: Users },
  { label: "Rent", href: "/dashboard/landlord/rent", icon: Banknote },
  { label: "Compliance", href: "/dashboard/landlord/compliance", icon: ShieldCheck },
  { label: "Compliance Matrix", href: "/dashboard/landlord/compliance/matrix", icon: Grid3X3 },
  { label: "Maintenance", href: "/dashboard/landlord/maintenance", icon: Wrench },
  { label: "Finance", href: "/dashboard/landlord/finance/expenses", icon: TrendingUp },
  { label: "Documents", href: "/dashboard/landlord/deposits", icon: FolderOpen },
  { label: "Tools", href: "/dashboard/landlord/tools/yield-calculator", icon: Calculator },
  { label: "Analytics", href: "/dashboard/landlord/analytics", icon: BarChart3 },
  { label: "Insurance", href: "/dashboard/landlord/insurance", icon: Shield },
  { label: "Find Agent", href: "/dashboard/landlord/find-agent", icon: Handshake },
];

const LEGAL_NAV_ITEM: NavItem = { label: "Legal", href: "/dashboard/landlord/legal/notices", icon: Scale };

// Note: NEXT_PUBLIC_* vars are inlined by the bundler at build time.
// Toggling this flag requires a full redeploy to take effect.
const NAV_ITEMS: NavItem[] = process.env.NEXT_PUBLIC_LEGAL_NOTICES_ENABLED === "true"
  ? [...BASE_NAV_ITEMS.slice(0, 9), LEGAL_NAV_ITEM, ...BASE_NAV_ITEMS.slice(9)]
  : BASE_NAV_ITEMS;

function NavLink(props: Readonly<{ item: NavItem; pathname: string }>) {
  const { item, pathname } = props;
  const Icon = item.icon;

  // Exact match for dashboard home; prefix match for sub-sections
  const isActive =
    item.href === "/dashboard/landlord"
      ? pathname === "/dashboard/landlord"
      : pathname === item.href || pathname.startsWith(item.href + "/");

  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className={
        isActive
          ? "flex items-center gap-3 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
          : "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
      }
    >
      <Icon className="size-4 shrink-0" />
      <span>{item.label}</span>
    </Link>
  );
}

function SidebarInner(props: Readonly<{ pathname: string }>) {
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-white dark:bg-neutral-900">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-neutral-200 px-5 py-5 dark:border-neutral-800">
        <div className="flex size-9 items-center justify-center rounded-xl bg-brand-primary text-white shadow-sm">
          <Building2 className="size-5" />
        </div>
        <h1 className="font-heading text-lg font-bold tracking-tight text-brand-primary">Britestate</h1>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-0.5 p-3" aria-label="Landlord dashboard navigation">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} pathname={props.pathname} />
        ))}
      </nav>
    </div>
  );
}

export function LandlordSidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop permanent sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 lg:block">
        <SidebarInner pathname={pathname} />
      </aside>

      {/* Mobile hamburger + sheet drawer */}
      <div className="fixed left-4 top-4 z-50 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-700 shadow-sm hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
              aria-label="Open navigation menu"
            >
              <Menu className="size-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0" showCloseButton={true}>
            <SidebarInner pathname={pathname} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
