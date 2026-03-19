"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger as SheetTriggerBase,
} from "@/components/ui/sheet";

// Type cast needed for base-ui Dialog.Trigger prop compatibility
const SheetTrigger = SheetTriggerBase as React.ComponentType<{
  asChild?: boolean;
  children: React.ReactNode;
}>;

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
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label="Open navigation menu"
              className="bg-white/90 backdrop-blur-sm shadow-sm"
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side={side} className={cn(width, "p-0")} showCloseButton>
            {children}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
