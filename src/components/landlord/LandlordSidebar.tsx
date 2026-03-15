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
  Menu,
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

const BASE_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard/landlord", icon: LayoutDashboard },
  { label: "Properties", href: "/dashboard/landlord/properties", icon: Building2 },
  { label: "Tenants", href: "/dashboard/landlord/tenants", icon: Users },
  { label: "Rent", href: "/dashboard/landlord/rent", icon: Banknote },
  { label: "Compliance", href: "/dashboard/landlord/compliance", icon: ShieldCheck },
  { label: "Maintenance", href: "/dashboard/landlord/maintenance", icon: Wrench },
  { label: "Finance", href: "/dashboard/landlord/finance/expenses", icon: TrendingUp },
  { label: "Documents", href: "/dashboard/landlord/deposits", icon: FolderOpen },
  { label: "Tools", href: "/dashboard/landlord/tools/yield-calculator", icon: Calculator },
  { label: "Analytics", href: "/dashboard/landlord/analytics", icon: BarChart3 },
  { label: "Find Agent", href: "/dashboard/landlord/find-agent", icon: Handshake },
];

const LEGAL_NAV_ITEM: NavItem = { label: "Legal", href: "/dashboard/landlord/legal/notices", icon: Scale };

const NAV_ITEMS: NavItem[] = process.env.NEXT_PUBLIC_LEGAL_NOTICES_ENABLED === "true"
  ? [...BASE_NAV_ITEMS.slice(0, 8), LEGAL_NAV_ITEM, ...BASE_NAV_ITEMS.slice(8)]
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
      className={
        isActive
          ? "flex items-center gap-3 rounded-lg border-l-4 border-[#1B4D3E] bg-[#1B4D3E]/10 px-4 py-3 text-sm font-semibold text-[#1B4D3E]"
          : "flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      }
    >
      <Icon className="size-4 shrink-0" />
      <span>{item.label}</span>
    </Link>
  );
}

function SidebarInner(props: Readonly<{ pathname: string }>) {
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b p-6">
        <div className="flex size-8 items-center justify-center rounded-lg bg-[#1B4D3E] text-white">
          <Building2 className="size-5" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-[#1B4D3E]">Britestate</h1>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1 p-4">
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
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r bg-background lg:block">
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
