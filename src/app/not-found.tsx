import Link from "next/link";
import { Home, SearchX, Building2, Headphones, MapPin } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "404 — Page Not Found | Britestate",
};

export default async function NotFound() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="flex items-center justify-between border-b border-brand-primary/10 bg-card px-6 py-5 lg:px-20">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex">
          {(
            [
              { href: "/search?type=buy", label: "Buy" },
              { href: "/search?type=rent", label: "Rent" },
              { href: "/marketplace", label: "Find Services" },
              { href: "/valuation", label: "Valuations" },
            ] as const
          ).map(({ href, label }) => (
            <Link
              key={label}
              href={href}
              className="font-body text-sm font-medium text-neutral-500 transition-colors hover:text-brand-primary"
            >
              {label}
            </Link>
          ))}
        </nav>
        {user ? (
          <Button asChild size="sm" variant="outline">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        ) : (
          <Button asChild size="sm" variant="outline">
            <Link href="/login">Sign In</Link>
          </Button>
        )}
      </header>

      {/* ── Main ───────────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mx-auto max-w-2xl">
          {/* Illustration */}
          <div className="relative mb-16 flex items-center justify-center">
            <span
              className="font-heading text-[180px] font-bold leading-none text-brand-primary/10 select-none"
              aria-hidden="true"
            >
              404
            </span>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-full bg-brand-primary-lighter p-8 dark:bg-brand-primary/20">
                <SearchX className="size-16 text-brand-primary" aria-hidden="true" />
              </div>
            </div>
          </div>

          {/* Heading */}
          <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
            Page not found
          </h1>
          <p className="mx-auto mt-3 max-w-lg font-body text-base leading-relaxed text-neutral-500">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved. Let&apos;s get you back on track.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex items-center rounded-lg bg-brand-primary px-6 py-2.5 font-body text-sm font-medium text-white transition-colors hover:bg-brand-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2"
            >
              <Home className="mr-2 size-4" aria-hidden="true" />
              Go Home
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center rounded-lg border border-neutral-200/60 px-6 py-2.5 font-body text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/30 focus-visible:ring-offset-2 dark:border-neutral-700/60"
            >
              <SearchX className="mr-2 size-4" aria-hidden="true" />
              Search Properties
            </Link>
          </div>

          {/* Helpful link cards */}
          <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Link
              href="/search"
              className="rounded-xl bg-card p-5 text-left shadow-sm ring-1 ring-neutral-200/60 transition-shadow hover:shadow-md dark:ring-neutral-700/60"
            >
              <Building2 className="mb-3 size-5 text-brand-primary" aria-hidden="true" />
              <p className="font-body text-sm font-medium text-foreground">New Listings</p>
              <p className="mt-1 font-body text-xs text-neutral-500">
                Explore the latest homes on the market.
              </p>
            </Link>
            <Link
              href="/help"
              className="rounded-xl bg-card p-5 text-left shadow-sm ring-1 ring-neutral-200/60 transition-shadow hover:shadow-md dark:ring-neutral-700/60"
            >
              <Headphones className="mb-3 size-5 text-brand-primary" aria-hidden="true" />
              <p className="font-body text-sm font-medium text-foreground">Help Centre</p>
              <p className="mt-1 font-body text-xs text-neutral-500">
                Need assistance? Talk to our support team.
              </p>
            </Link>
            <Link
              href="/areas"
              className="rounded-xl bg-card p-5 text-left shadow-sm ring-1 ring-neutral-200/60 transition-shadow hover:shadow-md dark:ring-neutral-700/60"
            >
              <MapPin className="mb-3 size-5 text-brand-primary" aria-hidden="true" />
              <p className="font-body text-sm font-medium text-foreground">Neighbourhoods</p>
              <p className="mt-1 font-body text-xs text-neutral-500">
                Find the perfect area for your next move.
              </p>
            </Link>
          </div>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-brand-primary/10 px-6 py-10 lg:px-20">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex flex-wrap items-center gap-8">
            {(
              [
                { href: "/privacy", label: "Privacy Policy" },
                { href: "/terms", label: "Terms of Service" },
                { href: "/contact", label: "Contact Us" },
              ] as const
            ).map(({ href, label }) => (
              <Link
                key={label}
                href={href}
                className="font-body text-sm text-neutral-500 transition-colors hover:text-brand-primary"
              >
                {label}
              </Link>
            ))}
          </div>
          <p className="font-body text-sm text-neutral-400">
            © 2026 Britestate. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
