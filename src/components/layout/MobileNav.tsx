"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Bell, MessageSquare, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/Logo";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { NAV_ITEMS, navLinkClasses } from "@/config/navigation";
import { ROUTES, savedDashboardPathForRole } from "@/lib/routes";
import { useRole } from "@/hooks/useRole";
import { cn } from "@/lib/utils";

export function MobileNav({
  open,
  onOpenChange,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { activeRole } = useRole();
  const close = () => onOpenChange(false);
  const savedHref = activeRole ? savedDashboardPathForRole(activeRole) : ROUTES.dashboard.root;
  const quickLinks = [
    { href: savedHref, label: "Saved", icon: Heart },
    { href: ROUTES.notifications, label: "Notifications", icon: Bell },
    { href: ROUTES.inbox, label: "Messages", icon: MessageSquare },
  ] as const;

  const toggleAccordion = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-80 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            <Logo size="sm" />
          </SheetTitle>
        </SheetHeader>

        {/* Quick-access icon row */}
        <div className="flex items-center gap-4 border-b px-4 pb-3">
          {quickLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={close}
              className="flex items-center gap-2 rounded-lg p-2 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
              aria-label={label}
            >
              <Icon className="size-5" />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          ))}
        </div>

        {/* Accordion navigation */}
        <nav className="flex flex-col px-2 py-2" aria-label="Mobile navigation">
          {NAV_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={item.label} className="border-b border-neutral-100 last:border-b-0">
                <button
                  data-testid={`accordion-trigger-${index}`}
                  data-accordion-trigger
                  onClick={() => toggleAccordion(index)}
                  className="flex w-full items-center justify-between px-3 py-3 text-base font-semibold text-neutral-800 transition-colors hover:bg-neutral-50"
                  aria-expanded={isOpen}
                >
                  {item.label}
                  <ChevronDown
                    className={cn(
                      "size-4 text-neutral-400 transition-transform duration-200",
                      isOpen && "rotate-180",
                    )}
                  />
                </button>
                <div
                  data-testid={`accordion-panel-${index}`}
                  data-open={isOpen ? "true" : "false"}
                  className={cn(
                    "overflow-hidden transition-all duration-200",
                    isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0",
                  )}
                >
                  {item.sections?.map((section) => (
                    <div key={section.heading} className="pb-2 pl-3">
                      <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                        {section.heading}
                      </p>
                      {section.links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={close}
                          className={cn(
                            navLinkClasses({ variant: "mobile" }),
                            "block rounded-md",
                          )}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Auth section */}
        <div className="mt-auto flex flex-col gap-2 border-t p-4">
          <Button
            variant="outline"
            className="w-full"
            render={<Link href="/login" onClick={close} />}
          >
            Sign In
          </Button>
          <Button
            className="w-full"
            render={<Link href="/register" onClick={close} />}
          >
            Get Started
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
