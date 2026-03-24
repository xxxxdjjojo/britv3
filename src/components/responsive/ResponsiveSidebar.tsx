"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

type ResponsiveSidebarProps = Readonly<{
  children: React.ReactNode;
  /** Extra classes on the desktop <aside> element */
  className?: string;
  /** Width class for the sidebar. Default: "w-64" */
  width?: string;
  /** Side the mobile sheet slides in from. Default: "left" */
  side?: "left" | "right";
}>;

/**
 * ResponsiveSidebar
 *
 * Desktop (lg+): Fixed sidebar on the left.
 * Mobile/Tablet (<lg): Hidden. Hamburger button opens a Sheet drawer.
 */
export function ResponsiveSidebar({
  children,
  className,
  width = "w-64",
  side = "left",
}: ResponsiveSidebarProps) {
  return (
    <>
      {/* Desktop: fixed sidebar, visible lg+ */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r bg-background lg:flex lg:flex-col",
          width,
          className,
        )}
      >
        {children}
      </aside>

      {/* Mobile/Tablet: hamburger button + Sheet drawer, visible <lg */}
      <div className="fixed left-4 top-4 z-50 lg:hidden">
        <Sheet>
          <SheetTrigger
            className="inline-flex size-10 items-center justify-center rounded-md border bg-white/90 text-foreground shadow-sm backdrop-blur-sm hover:bg-accent"
            aria-label="Open navigation menu"
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side={side} className={cn(width, "p-0")} showCloseButton>
            {children}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
