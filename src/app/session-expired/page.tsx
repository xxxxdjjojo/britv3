import type { Metadata } from "next";
import Link from "next/link";
import { Clock, LogIn } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Session Expired | Britestate",
  robots: { index: false },
};

export default function SessionExpiredPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-brand-primary/10 bg-card px-6 py-4 md:px-10">
        <Logo />
        <Button asChild size="sm" variant="ghost" aria-label="Go to Help Centre">
          <Link href="/help">Help Centre</Link>
        </Button>
      </header>

      {/* Main */}
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="flex w-full max-w-md flex-col items-center rounded-2xl bg-card p-8 shadow-lg md:p-12">
          {/* Icon */}
          <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-brand-primary">
            <Clock className="size-10 text-white" aria-hidden="true" />
          </div>

          {/* Error badge */}
          <div className="mb-4">
            <span className="inline-block rounded-full bg-warning-light px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-warning dark:bg-warning/20 dark:text-warning">
              Session Expired
            </span>
          </div>

          {/* Text */}
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <h1 className="font-heading text-4xl font-bold tracking-tight text-brand-primary md:text-5xl">
              Your session has expired
            </h1>
            <p className="max-w-sm text-sm leading-relaxed text-neutral-600">
              Please sign in again to continue.
            </p>
          </div>

          {/* Actions */}
          <div className="w-full space-y-4">
            <Button
              asChild
              size="lg"
              className="h-12 w-full bg-brand-primary text-white hover:bg-brand-primary/90"
              aria-label="Sign in to your account"
            >
              <Link href="/login">
                <LogIn className="mr-2 size-4" aria-hidden="true" />
                Sign In
              </Link>
            </Button>

            <div className="flex justify-center">
              <Link
                href="/"
                className="text-[11px] uppercase tracking-[0.15em] text-neutral-400 hover:text-neutral-600"
                aria-label="Return to home page"
              >
                Return to Journey
              </Link>
            </div>
          </div>

          {/* Security note */}
          <p className="mt-8 text-center text-xs text-neutral-400">
            Sessions expire after 30 minutes of inactivity to keep your account secure.
          </p>

          {/* Gold security badge */}
          <p className="mt-4 text-[11px] font-medium tracking-[0.1em] text-brand-secondary">
            ★ Editorial Security
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-brand-primary/5 px-6 py-5 text-center">
        <p className="text-xs text-neutral-400">
          © 2026 Britestate. All rights reserved.{" "}
          <Link href="/privacy" className="underline hover:text-neutral-600">
            Privacy Policy
          </Link>
          {" · "}
          <Link href="/terms" className="underline hover:text-neutral-600">
            Terms of Service
          </Link>
        </p>
      </footer>
    </div>
  );
}
