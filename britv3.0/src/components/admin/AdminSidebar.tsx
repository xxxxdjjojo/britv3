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
import { clsx } from "clsx";

type NavItem = {
  label: string;
  href: string;
};

type ExternalNavItem = {
  label: string;
  href: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/admin" },
  { label: "Users", href: "/admin/users" },
  { label: "Moderation", href: "/admin/moderation" },
  { label: "Verifications", href: "/admin/verifications" },
  { label: "Reviews", href: "/admin/reviews" },
];

const NAV_ICONS: Record<string, React.ElementType> = {
  "/admin": LayoutDashboard,
  "/admin/users": Users,
  "/admin/moderation": ShieldAlert,
  "/admin/verifications": BadgeCheck,
  "/admin/reviews": Star,
};

const EXTERNAL_LINKS: ExternalNavItem[] = [
  {
    label: "Supabase Dashboard",
    href: "https://supabase.com/dashboard",
  },
  {
    label: "Sentry Dashboard",
    href: "https://sentry.io",
  },
  {
    label: "PostHog Dashboard",
    href: "https://app.posthog.com",
  },
  {
    label: "Stripe Dashboard",
    href: "https://dashboard.stripe.com",
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 w-64 border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <span className="text-lg font-semibold text-gray-900">
          Britestate Admin
        </span>
      </div>

      <nav className="flex flex-col gap-1 p-4">
        {NAV_ITEMS.map(({ label, href }) => {
          const Icon = NAV_ICONS[href];
          const isActive =
            href === "/admin" ? pathname === href : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-4">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          External Dashboards
        </p>
        <div className="flex flex-col gap-1">
          {EXTERNAL_LINKS.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
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
