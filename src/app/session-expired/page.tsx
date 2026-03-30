import type { Metadata } from "next";
import Link from "next/link";
import { Clock, LogIn, Home } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Session Expired | Britestate",
  robots: { index: false },
};

export default function SessionExpiredPage() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4 md:px-10">
        <Logo />
        <Button asChild size="sm" variant="ghost" aria-label="Go to Help Centre">
          <Link href="/help">Help Centre</Link>
        </Button>
      </header>

      {/* Main */}
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="flex w-full max-w-md flex-col items-center rounded-2xl bg-white p-8 shadow-lg md:p-12">
          {/* Icon */}
          <div className="mb-8 flex size-20 items-center justify-center rounded-full bg-brand-primary-lighter">
            <Clock className="size-10 text-brand-primary" aria-hidden="true" />
          </div>

          {/* Text */}
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">
              Your session has expired
            </h1>
            <p className="max-w-sm text-sm leading-relaxed text-neutral-600">
              For your security, you have been signed out due to inactivity.
              Please sign in again to continue where you left off.
            </p>
          </div>

          {/* Actions */}
          <div className="w-full space-y-3">
            <Button
              asChild
              size="lg"
              className="h-12 w-full bg-brand-primary text-white hover:bg-brand-primary-light"
              aria-label="Sign in to your account"
            >
              <Link href="/login">
                <LogIn className="mr-2 size-4" aria-hidden="true" />
                Sign In Again
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 w-full border-neutral-200 text-neutral-700 hover:bg-neutral-50"
              aria-label="Return to home page"
            >
              <Link href="/">
                <Home className="mr-2 size-4" aria-hidden="true" />
                Return to Home
              </Link>
            </Button>
          </div>

          {/* Security note */}
          <p className="mt-8 text-center text-xs text-neutral-400">
            Sessions expire after 30 minutes of inactivity to keep your account secure.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-100 px-6 py-5 text-center">
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
