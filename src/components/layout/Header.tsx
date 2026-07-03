"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/Logo";
import { MegaMenu } from "@/components/layout/MegaMenu";
import { MobileNav } from "@/components/layout/MobileNav";
import { SearchTrigger } from "@/components/layout/SearchTrigger";
import { AuthButtons } from "@/components/layout/AuthButtons";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

type HeaderProps = Readonly<{
  transparent?: boolean;
}>;

export function Header({ transparent = false }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 4);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      setUser(authUser);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const isTransparent = transparent && !scrolled;

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-brand-primary focus:px-4 focus:py-2 focus:text-white focus:shadow-lg"
      >
        Skip to main content
      </a>
      <header
        className={cn(
          "sticky top-0 z-40 w-full transition-all duration-200",
          isTransparent
            ? "bg-transparent border-b border-transparent"
            : "bg-white/95 backdrop-blur-sm border-b border-neutral-100",
          scrolled ? "shadow-sm" : "shadow-none",
        )}
      >
        <div className="mx-auto flex h-14 md:h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left zone: Logo */}
          <Logo size="md" />

          {/* Center zone: MegaMenu (desktop only) */}
          <MegaMenu />

          {/* Right zone: Actions */}
          <div className="flex items-center gap-1">
            <SearchTrigger transparent={isTransparent} />
            <AuthButtons user={user} transparent={isTransparent} />

            {/* Mobile Hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden min-w-11 min-h-11"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <MobileNav
          open={mobileOpen}
          onOpenChange={setMobileOpen}
        />
      </header>
    </>
  );
}
