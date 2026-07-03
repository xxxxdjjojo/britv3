import type { Metadata } from "next";
import Link from "next/link";
import { Clock, LogIn, Home } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Session Expired | TrueDeed",
  robots: { index: false },
};

export default function SessionExpiredPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-neutral-50">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="flex items-center justify-between border-b border-brand-primary/10 bg-white px-6 py-5 md:px-10">
        <Logo />
        <Button asChild size="sm" variant="ghost">
          <Link href="/help">Help Centre</Link>
        </Button>
      </header>

      {/* ── Main ───────────────────────────────────────────────── */}
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="flex w-full max-w-[480px] flex-col items-center rounded-xl border border-brand-primary/5 bg-white p-8 shadow-sm md:p-12">
          {/* Clock icon */}
          <div className="relative mb-8">
            <div className="absolute inset-0 scale-150 rounded-full bg-brand-primary/5 blur-xl" />
            <div className="relative flex size-24 items-center justify-center rounded-full bg-brand-primary-lighter text-brand-primary">
              <Clock className="size-12" aria-hidden="true" />
            </div>
          </div>

          {/* Text */}
          <div className="mb-10 flex flex-col items-center gap-3 text-center">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">
              Your session has expired
            </h1>
            <p className="max-w-xs leading-relaxed text-neutral-600">
              For your security, you have been logged out due to inactivity.
              Please sign in again to continue.
            </p>
          </div>

          {/* Actions */}
          <div className="w-full space-y-3">
            <Button
              asChild
              size="lg"
              className="h-12 w-full shadow-md"
            >
              <Link href="/login">
                <LogIn className="mr-2 size-5" aria-hidden="true" />
                Sign In
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 w-full">
              <Link href="/">
                <Home className="mr-2 size-5" aria-hidden="true" />
                Return to Home
              </Link>
            </Button>
          </div>

          {/* Decorative property image strip */}
          <div className="relative mt-12 h-40 w-full overflow-hidden rounded-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-brand-primary/5" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="grid grid-cols-3 gap-2 opacity-30">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-10 rounded bg-brand-primary/40"
                    aria-hidden="true"
                  />
                ))}
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="font-heading text-sm font-semibold text-brand-primary/60">
                Your saved properties are waiting
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="p-6 text-center">
        <p className="text-xs text-neutral-400">
          © 2026 TrueDeed Real Estate. All rights reserved. Secure session
          management.
        </p>
      </footer>
    </div>
  );
}
