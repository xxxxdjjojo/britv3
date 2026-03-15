import type { Metadata } from "next";
import Link from "next/link";
import { LockKeyhole, Home, Headphones, BookOpen, Shield } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "403 — Access Denied | Britestate",
  robots: { index: false },
};

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="flex items-center justify-between border-b border-brand-primary/10 bg-white px-6 py-5 md:px-20">
        <Logo />
        <Button
          asChild
          size="sm"
          className="size-10 rounded-full p-0"
          variant="ghost"
        >
          <Link href="/dashboard" aria-label="Account">
            <span
              className="flex size-9 items-center justify-center rounded-full bg-brand-primary-lighter text-brand-primary"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="size-5"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
              </svg>
            </span>
          </Link>
        </Button>
      </header>

      {/* ── Main ───────────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12 md:py-24">
        <div className="flex w-full max-w-[560px] flex-col items-center text-center">
          {/* Lock illustration */}
          <div className="relative mb-10">
            <div className="absolute inset-0 scale-150 rounded-full bg-brand-primary/5 blur-3xl" />
            <div className="relative flex size-48 items-center justify-center rounded-full border border-brand-primary/5 bg-white shadow-xl">
              <LockKeyhole
                className="size-20 text-brand-primary"
                strokeWidth={1.25}
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Text */}
          <div className="mb-10 flex flex-col gap-4">
            <h1 className="font-heading text-4xl font-bold tracking-tight text-neutral-900 md:text-5xl">
              Access denied
            </h1>
            <p className="mx-auto max-w-md text-lg leading-relaxed text-neutral-600">
              You don&apos;t have permission to view this page. If you think
              this is a mistake, please contact support.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex w-full flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="w-full min-w-40 sm:w-auto">
              <Link href="/">
                <Home className="mr-2 size-5" aria-hidden="true" />
                Go Home
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full min-w-40 sm:w-auto"
            >
              <Link href="/help">
                <Headphones className="mr-2 size-5" aria-hidden="true" />
                Contact Support
              </Link>
            </Button>
          </div>

          {/* Helpful links grid */}
          <div className="mt-16 grid w-full grid-cols-1 gap-8 border-t border-neutral-200 pt-10 sm:grid-cols-3">
            {(
              [
                {
                  href: "/help",
                  icon: Headphones,
                  label: "Help Centre",
                },
                {
                  href: "/about",
                  icon: BookOpen,
                  label: "Documentation",
                },
                {
                  href: "/contact",
                  icon: Shield,
                  label: "Security Status",
                },
              ] as const
            ).map(({ href, icon: Icon, label }) => (
              <Link
                key={label}
                href={href}
                className="flex flex-col items-center gap-2 transition-colors hover:text-brand-primary"
              >
                <Icon
                  className="size-5 text-brand-primary/60"
                  aria-hidden="true"
                />
                <span className="text-sm font-medium text-neutral-500">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="flex flex-col gap-6 border-t border-brand-primary/5 bg-white px-6 py-10 text-center">
        <div className="flex flex-wrap items-center justify-center gap-8">
          {(
            [
              { href: "/privacy", label: "Privacy Policy" },
              { href: "/terms", label: "Terms of Service" },
              { href: "/legal", label: "Cookie Policy" },
            ] as const
          ).map(({ href, label }) => (
            <Link
              key={label}
              href={href}
              className="text-sm font-medium text-neutral-500 transition-colors hover:text-brand-primary"
            >
              {label}
            </Link>
          ))}
        </div>
        <p className="text-sm text-neutral-400">
          © 2026 Britestate Real Estate. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
