import Link from "next/link";
import { Home, SearchX, Building2, Headphones, MapPin } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "404 — Page Not Found | TrueDeed",
};

export default async function NotFound() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="flex items-center justify-between border-b border-brand-primary/10 bg-white px-6 py-5 lg:px-20">
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
              className="text-sm font-medium text-neutral-600 transition-colors hover:text-brand-primary"
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
            <div className="flex size-64 items-center justify-center rounded-full bg-brand-primary-lighter md:size-80">
              <Home className="size-28 text-brand-primary/20 md:size-36" aria-hidden="true" />
            </div>
            {/* Badge — top-right */}
            <div className="absolute right-0 top-2 rounded-xl border border-brand-primary/10 bg-white p-4 shadow-md md:-right-4">
              <SearchX className="size-8 text-brand-primary" aria-hidden="true" />
            </div>
            {/* Error 404 pill — below circle */}
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-brand-primary/20 bg-neutral-50 px-6 py-2 shadow-sm">
              <span className="font-heading text-sm font-semibold uppercase tracking-widest text-brand-primary">
                Error 404
              </span>
            </div>
          </div>

          {/* Heading */}
          <h1 className="font-heading text-5xl font-light text-neutral-400 md:text-6xl">
            Page not found
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-lg leading-relaxed text-neutral-600">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved. Let&apos;s get you back on track.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/">
                <Home className="mr-2 size-5" aria-hidden="true" />
                Go Home
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Link href="/search">
                <SearchX className="mr-2 size-5" aria-hidden="true" />
                Search Properties
              </Link>
            </Button>
          </div>

          {/* Helpful link cards */}
          <div className="mt-20 grid grid-cols-1 gap-6 md:grid-cols-3">
            <Link
              href="/search"
              className="group rounded-xl border border-brand-primary/10 bg-white/60 p-6 text-left transition-all hover:border-brand-primary/30 hover:bg-white hover:shadow-md"
            >
              <Building2
                className="mb-3 size-6 text-brand-primary"
                aria-hidden="true"
              />
              <h3 className="mb-1 font-heading font-semibold text-neutral-800">
                New Listings
              </h3>
              <p className="text-sm text-neutral-500">
                Explore the latest homes on the market.
              </p>
            </Link>
            <Link
              href="/help"
              className="group rounded-xl border border-brand-primary/10 bg-white/60 p-6 text-left transition-all hover:border-brand-primary/30 hover:bg-white hover:shadow-md"
            >
              <Headphones
                className="mb-3 size-6 text-brand-primary"
                aria-hidden="true"
              />
              <h3 className="mb-1 font-heading font-semibold text-neutral-800">
                Help Centre
              </h3>
              <p className="text-sm text-neutral-500">
                Need assistance? Talk to our support team.
              </p>
            </Link>
            <Link
              href="/areas"
              className="group rounded-xl border border-brand-primary/10 bg-white/60 p-6 text-left transition-all hover:border-brand-primary/30 hover:bg-white hover:shadow-md"
            >
              <MapPin
                className="mb-3 size-6 text-brand-primary"
                aria-hidden="true"
              />
              <h3 className="mb-1 font-heading font-semibold text-neutral-800">
                Neighbourhoods
              </h3>
              <p className="text-sm text-neutral-500">
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
                className="text-sm text-neutral-500 transition-colors hover:text-brand-primary"
              >
                {label}
              </Link>
            ))}
          </div>
          <p className="text-sm text-neutral-400">
            © 2026 TrueDeed. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
