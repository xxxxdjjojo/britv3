import type { Metadata } from "next";
import Link from "next/link";
import { LockKeyhole, Home, Headphones, BookOpen } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "403 — Access Denied | Britestate",
  robots: { index: false },
};

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="flex items-center justify-between border-b border-brand-primary/10 bg-card px-6 py-5 md:px-20">
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
          <div className="mb-6 flex items-center justify-center">
            <div className="rounded-full bg-brand-primary-lighter p-8 dark:bg-brand-primary/20">
              <LockKeyhole
                className="size-14 text-brand-primary"
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Error badge */}
          <div className="mb-4">
            <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-amber-700 dark:bg-amber-900/20 dark:text-amber-500">
              Error 403
            </span>
          </div>

          {/* Text */}
          <div className="mb-8 flex flex-col gap-3">
            <h1 className="font-heading text-4xl font-bold text-brand-primary md:text-5xl">
              Access denied
            </h1>
            <p className="mx-auto max-w-md font-body text-base leading-relaxed text-neutral-500">
              You don&apos;t have permission to view this page. If you think
              this is a mistake, please contact support.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex min-w-40 items-center justify-center rounded-lg bg-brand-primary px-6 py-2.5 font-body text-sm font-medium text-white transition-colors hover:bg-brand-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 focus-visible:ring-offset-2"
            >
              <Home className="mr-2 size-4" aria-hidden="true" />
              Go Home
            </Link>
            <Link
              href="/help"
              className="inline-flex min-w-40 items-center justify-center rounded-lg bg-amber-100 px-6 py-2.5 font-body text-sm font-medium text-amber-800 transition-colors hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/30 focus-visible:ring-offset-2 dark:bg-amber-900/20 dark:text-amber-300"
            >
              <Headphones className="mr-2 size-4" aria-hidden="true" />
              Contact Support
            </Link>
          </div>

          {/* Helpful links grid */}
          <div className="mt-14 grid w-full grid-cols-1 gap-4 border-t border-neutral-200/60 pt-10 dark:border-neutral-700/60 md:grid-cols-2">
            {(
              [
                {
                  href: "/help",
                  icon: Headphones,
                  label: "Help Centre",
                  description: "Browse our support articles and get answers fast.",
                },
                {
                  href: "/about",
                  icon: BookOpen,
                  label: "Documentation",
                  description: "Learn about Britestate features and how they work.",
                },
              ] as const
            ).map(({ href, icon: Icon, label, description }) => (
              <Link
                key={label}
                href={href}
                className="rounded-xl bg-card p-4 text-left shadow-sm ring-1 ring-neutral-200/60 transition-shadow hover:shadow-md dark:ring-neutral-700/60"
              >
                <Icon className="mb-2 size-5 text-brand-primary" aria-hidden="true" />
                <p className="font-body text-sm font-medium text-foreground">{label}</p>
                <p className="mt-1 font-body text-xs text-neutral-500">{description}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="flex flex-col gap-6 border-t border-brand-primary/5 bg-card px-6 py-10 text-center">
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
              className="font-body text-sm font-medium text-neutral-500 transition-colors hover:text-brand-primary"
            >
              {label}
            </Link>
          ))}
        </div>
        <p className="font-body text-sm text-neutral-400">
          © 2026 Britestate Real Estate. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
