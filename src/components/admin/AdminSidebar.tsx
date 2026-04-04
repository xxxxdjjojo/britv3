"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ChevronDown,
  Shield,
  Settings,
  FileText,
  LineChart,
  Users,
  BarChart2,
  DollarSign,
  MousePointer,
  Search,
  Home,
  BadgeCheck,
  Star,
  Flag,
  ToggleLeft,
  Activity,
  Cpu,
  Lock,
  ClipboardList,
  AlertTriangle,
  BookOpen,
  HelpCircle,
  Globe,
  CreditCard,
  Tag,
  Mail,
  UserCheck,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ResponsiveSidebar } from "@/components/responsive/ResponsiveSidebar";
import type { AdminRole } from "@/lib/admin-permissions";
import { getAccessibleNavGroups } from "@/lib/admin-permissions";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

type NavGroup = {
  label: string;
  icon: React.ElementType;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Platform Metrics", href: "/admin/analytics/platform", icon: BarChart2 },
      { label: "Revenue Reports", href: "/admin/analytics/revenue", icon: DollarSign },
      { label: "User Behaviour", href: "/admin/analytics/behaviour", icon: MousePointer },
      { label: "Search Insights", href: "/admin/analytics/search", icon: Search },
    ],
  },
  {
    label: "Moderation",
    icon: Shield,
    items: [
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Listings", href: "/admin/moderation", icon: Home },
      { label: "Verifications", href: "/admin/verifications", icon: BadgeCheck },
      { label: "Reviews", href: "/admin/reviews", icon: Star },
      { label: "Reported Content", href: "/admin/reported", icon: Flag },
    ],
  },
  {
    label: "Operations",
    icon: Settings,
    items: [
      { label: "Feature Flags", href: "/admin/feature-flags", icon: ToggleLeft },
      { label: "System Health", href: "/admin/system-health", icon: Activity },
      { label: "API Usage", href: "/admin/api-usage", icon: Cpu },
      { label: "GDPR Requests", href: "/admin/gdpr", icon: Lock },
      { label: "Audit Log", href: "/admin/audit-log", icon: ClipboardList },
      { label: "Fraud Detection", href: "/admin/fraud", icon: AlertTriangle },
    ],
  },
  {
    label: "Content",
    icon: FileText,
    items: [
      { label: "Blog", href: "/admin/cms/blog", icon: BookOpen },
      { label: "Help Articles", href: "/admin/cms/help", icon: HelpCircle },
      { label: "Landing Pages", href: "/admin/cms/landing", icon: Globe },
      { label: "SEO", href: "/admin/seo", icon: Search },
    ],
  },
  {
    label: "Growth",
    icon: LineChart,
    items: [
      { label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
      { label: "Promo Codes", href: "/admin/promo-codes", icon: Tag },
      { label: "Email Campaigns", href: "/admin/email-campaigns", icon: Mail },
    ],
  },
  {
    label: "Team",
    icon: Users,
    items: [
      { label: "Members", href: "/admin/team", icon: UserCheck },
      { label: "Roles & Permissions", href: "/admin/roles", icon: ShieldCheck },
    ],
  },
];

function isGroupActive(group: NavGroup, pathname: string): boolean {
  return group.items.some((item) =>
    item.href === "/admin"
      ? pathname === item.href
      : pathname.startsWith(item.href),
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  pathname,
}: Readonly<{
  href: string;
  label: string;
  icon: React.ElementType;
  pathname: string;
}>) {
  const isActive =
    href === "/admin" ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-3 py-1.5 font-body text-sm transition-all duration-200 ml-1",
        isActive
          ? "bg-brand-primary/50 text-success border-l-2 border-brand-secondary font-semibold"
          : "text-brand-primary-lighter/70 hover:bg-brand-primary/30 hover:text-brand-primary-lighter",
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {label}
    </Link>
  );
}

function CollapsibleGroup({
  group,
  pathname,
}: Readonly<{
  group: NavGroup;
  pathname: string;
}>) {
  // Track whether the user has manually collapsed an active group
  const [userCollapsed, setUserCollapsed] = useState(false);
  const GroupIcon = group.icon;

  const isActive = isGroupActive(group, pathname);
  // Open if active (unless user collapsed it); open if previously user-opened
  const [manuallyOpened, setManuallyOpened] = useState(!isActive);
  const open = isActive ? !userCollapsed : manuallyOpened;

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          if (isActive) {
            setUserCollapsed((prev) => !prev);
          } else {
            setManuallyOpened((prev) => !prev);
          }
        }}
        className="flex w-full items-center justify-between px-3 py-2 font-body text-[10px] font-semibold uppercase tracking-widest text-brand-primary-light/60 hover:text-brand-primary-lighter/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <GroupIcon className="h-3.5 w-3.5" />
          {group.label}
        </div>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-200",
            open ? "rotate-180" : "rotate-0",
          )}
        />
      </button>
      {open && (
        <div className="flex flex-col gap-0.5 pb-2">
          {group.items.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              pathname={pathname}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarContent({ adminRole }: { adminRole: AdminRole }) {
  const pathname = usePathname();
  const accessibleGroups = getAccessibleNavGroups(adminRole);

  return (
    <>
      <div className="flex h-16 shrink-0 flex-col items-start justify-center px-6 bg-brand-primary-dark">
        <span className="font-heading text-base font-bold tracking-tighter text-brand-primary-lighter leading-none">
          Britestate
        </span>
        <span className="font-body text-[10px] font-medium tracking-[0.15em] text-brand-primary-light/60 uppercase mt-0.5">
          Admin Console
        </span>
      </div>

      <nav className="flex flex-col gap-0.5 p-3 flex-1 overflow-y-auto">
        {NAV_GROUPS.filter((group) => accessibleGroups.includes(group.label)).map((group) => (
          <CollapsibleGroup
            key={group.label}
            group={group}
            pathname={pathname}
          />
        ))}
      </nav>

      <div className="border-t border-brand-primary/40 p-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-md px-3 py-2 font-body text-sm text-brand-primary-lighter/70 hover:bg-brand-primary/30 hover:text-brand-primary-lighter transition-colors"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          Back to Platform
        </Link>
      </div>
    </>
  );
}

export function AdminSidebar({ adminRole }: Readonly<{ adminRole: AdminRole }>) {
  return (
    <ResponsiveSidebar className="border-0 bg-brand-primary-dark">
      <SidebarContent adminRole={adminRole} />
    </ResponsiveSidebar>
  );
}
