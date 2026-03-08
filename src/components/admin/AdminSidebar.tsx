"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  BadgeCheck,
  Star,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

type ExternalNavItem = {
  label: string;
  href: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Moderation", href: "/admin/moderation", icon: ShieldAlert },
  { label: "Verifications", href: "/admin/verifications", icon: BadgeCheck },
  { label: "Reviews", href: "/admin/reviews", icon: Star },
];

const EXTERNAL_LINKS: ExternalNavItem[] = [
  { label: "Supabase Dashboard", href: "https://supabase.com/dashboard" },
  { label: "Sentry Dashboard", href: "https://sentry.io" },
  { label: "PostHog Dashboard", href: "https://app.posthog.com" },
  { label: "Stripe Dashboard", href: "https://dashboard.stripe.com" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 w-64 border-r border-neutral-200 bg-white">
      <div className="flex h-16 items-center border-b border-neutral-200 px-6">
        <span className="font-heading text-lg font-semibold text-neutral-900">
          Britestate Admin
        </span>
      </div>

      <nav className="flex flex-col gap-1 p-4">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === "/admin" ? pathname === href : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-l-2 border-brand-primary bg-brand-primary-lighter text-brand-primary"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-neutral-200 p-4">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
          External Dashboards
        </p>
        <div className="flex flex-col gap-1">
          {EXTERNAL_LINKS.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-700"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              {label}
            </a>
          ))}
        </div>
      </div>
    </aside>
  );
}
