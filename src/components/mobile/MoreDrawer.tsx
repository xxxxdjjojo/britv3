"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal, User } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import type { RoleNavItem } from "@/config/navigation";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type Props = {
  roleNavItems: readonly RoleNavItem[];
  excludeHrefs: readonly string[];
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MoreDrawer({ roleNavItems, excludeHrefs }: Props) {
  const pathname = usePathname();

  const extraItems = roleNavItems.filter(
    (item) => !excludeHrefs.includes(item.href),
  );

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative flex flex-1 flex-col items-center justify-center gap-0.5 min-h-12 py-2 text-xs font-medium transition-colors",
            "text-neutral-500 hover:text-neutral-900",
          )}
          aria-label="More options"
        >
          <MoreHorizontal size={20} className="text-neutral-400" />
          <span>More</span>
        </button>
      </DrawerTrigger>

      <DrawerContent className="pb-safe">
        <DrawerHeader>
          <DrawerTitle>More options</DrawerTitle>
        </DrawerHeader>

        <nav
          aria-label="More navigation options"
          className="flex flex-col overflow-y-auto px-2 pb-safe"
        >
          {extraItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <DrawerClose asChild key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors min-h-[44px]",
                    isActive
                      ? "bg-muted text-primary"
                      : "text-foreground hover:bg-muted",
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="size-6 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </DrawerClose>
            );
          })}

          {/* Profile always at the bottom */}
          <DrawerClose asChild>
            <Link
              href="/profile"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors min-h-[44px] mt-1 border-t border-muted",
                pathname.startsWith("/profile")
                  ? "bg-muted text-primary"
                  : "text-foreground hover:bg-muted",
              )}
              aria-current={pathname.startsWith("/profile") ? "page" : undefined}
            >
              <User className="size-6 shrink-0" />
              <span>Profile</span>
            </Link>
          </DrawerClose>
        </nav>
      </DrawerContent>
    </Drawer>
  );
}
