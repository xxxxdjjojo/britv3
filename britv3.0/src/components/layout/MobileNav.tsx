"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/Logo";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type NavLink = Readonly<{
  href: string;
  label: string;
}>;

export function MobileNav({
  open,
  onOpenChange,
  links,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  links: readonly NavLink[];
}>) {
  const close = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle>
            <Logo size="sm" />
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-1 px-4" aria-label="Mobile navigation">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

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
