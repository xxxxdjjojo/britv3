"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Briefcase, PoundSterling, LayoutDashboard } from "lucide-react";

const TABS = [
  { label: "Today", href: "/dashboard/provider/field", icon: Calendar },
  { label: "Jobs", href: "/dashboard/provider/field/jobs", icon: Briefcase },
  { label: "Payments", href: "/dashboard/provider/field/payments", icon: PoundSterling },
  { label: "Full View", href: "/dashboard/provider", icon: LayoutDashboard },
] as const;

export function FieldBottomNav() {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    // Exact match for the "Today" tab (field root)
    if (href === "/dashboard/provider/field") {
      return pathname === "/dashboard/provider/field";
    }
    // Prefix match for sub-routes; also exact for Full View
    return pathname.startsWith(href);
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-white"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Field navigation"
    >
      <div className="grid grid-cols-4">
        {TABS.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex min-h-12 flex-col items-center justify-center gap-1 px-2 py-2 text-xs font-medium transition-colors",
                active
                  ? "text-brand-primary"
                  : "text-neutral-400 hover:text-neutral-600",
              ].join(" ")}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                className={["size-5 shrink-0", active ? "text-brand-primary" : "text-neutral-400"].join(
                  " ",
                )}
                aria-hidden="true"
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
