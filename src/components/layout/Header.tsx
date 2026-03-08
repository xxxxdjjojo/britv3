"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/Logo";
import { MobileNav } from "@/components/layout/MobileNav";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/search", label: "Search Properties" },
] as const;

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 4);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur-sm transition-shadow",
        scrolled ? "shadow-sm" : "shadow-none",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Logo size="md" />

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Auth Buttons (Desktop) */}
        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="sm" render={<Link href="/login" />}>
            Sign In
          </Button>
          <Button size="sm" render={<Link href="/register" />}>
            Get Started
          </Button>
        </div>

        {/* Mobile Hamburger */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </Button>
      </div>

      {/* Mobile Navigation */}
      <MobileNav
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        links={NAV_LINKS}
      />
    </header>
  );
}
