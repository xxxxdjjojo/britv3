"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "@/hooks/useRole";
import { useVirtualKeyboard } from "@/hooks/useVirtualKeyboard";
import { cn } from "@/lib/utils";
import { TAB_CONFIG, ROLE_NAV_ITEMS } from "@/config/navigation";
import { MoreDrawer } from "./MoreDrawer";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BottomTabBar() {
  const pathname = usePathname();
  const { activeRole } = useRole();
  const keyboardOpen = useVirtualKeyboard();

  if (!activeRole) return null;

  // Defensive: `activeRole` is a DB string cast to UserRole, so a role the tab
  // map doesn't know must hide the bar rather than throw on `tabs.map` and
  // white-screen the dashboard (same DB↔type drift rationale as Sidebar).
  const tabs = TAB_CONFIG[activeRole] ?? [];
  if (tabs.length === 0) return null;

  const firstFourTabs = tabs.slice(0, 4);
  const excludeHrefs = firstFourTabs.map((t) => t.href);

  return (
    <nav
      aria-label="Mobile navigation"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-neutral-200 bg-white pb-safe lg:hidden transition-transform duration-200",
        keyboardOpen && "translate-y-full",
      )}
    >
      {firstFourTabs.map((tab) => {
        const isActive =
          tab.href === "/"
            ? pathname === tab.href
            : pathname.startsWith(tab.href);
        const Icon = tab.icon;
        const isMessages = tab.label === "Messages";

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "relative flex flex-1 flex-col items-center justify-center gap-0.5 min-h-12 py-2 text-xs font-medium transition-colors",
              isActive
                ? "text-brand-primary"
                : "text-neutral-500 hover:text-neutral-900",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon
              size={20}
              className={isActive ? "text-brand-primary" : "text-neutral-400"}
            />
            <span>{tab.label}</span>
            {isMessages && (
              <span
                data-badge="messages"
                className="absolute top-1.5 right-1/4 hidden size-2 rounded-full bg-red-500"
                aria-label="Unread messages"
              />
            )}
          </Link>
        );
      })}
      <MoreDrawer
        roleNavItems={ROLE_NAV_ITEMS[activeRole] ?? []}
        excludeHrefs={excludeHrefs}
      />
    </nav>
  );
}
