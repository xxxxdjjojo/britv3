"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Wrench, RefreshCw, Home, ExternalLink } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  useEffect(() => {
    // Log to error reporting service in production
    console.error("[ErrorBoundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="flex items-center justify-between border-b border-brand-primary/10 bg-card px-6 py-5 lg:px-10">
        <Logo />
        <Button asChild size="sm" variant="ghost">
          <Link href="/help">Help</Link>
        </Button>
      </header>

      {/* ── Main ───────────────────────────────────────────────── */}
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl bg-card p-8 text-center shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60 md:p-12">
          {/* Illustration */}
          <div className="mb-4 flex items-center justify-center">
            <div className="rounded-full bg-brand-primary-lighter p-6 dark:bg-brand-primary/20">
              <Wrench className="size-12 text-brand-primary" aria-hidden="true" />
            </div>
          </div>

          {/* Error badge */}
          <div className="mb-4">
            <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-amber-700 dark:bg-amber-900/20 dark:text-amber-500">
              Error 500
            </span>
          </div>

          {/* Text */}
          <div className="space-y-2">
            <h1 className="font-heading text-4xl font-bold text-brand-primary md:text-5xl">
              Something went wrong
            </h1>
            <p className="font-body text-base leading-relaxed text-neutral-500">
              We&apos;re working on fixing this. Please try again in a moment.
            </p>
            {error.digest && (
              <p className="font-mono text-xs text-muted-foreground">
                ref: {error.digest}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col gap-3">
            <Button
              size="lg"
              className="h-12 w-full font-body text-sm font-medium"
              onClick={reset}
            >
              <RefreshCw className="mr-2 size-4" aria-hidden="true" />
              Try Again
            </Button>
            <Button
              asChild
              size="lg"
              className="h-12 w-full bg-amber-100 font-body text-sm font-medium text-amber-800 hover:bg-amber-200 dark:bg-amber-900/20 dark:text-amber-300"
            >
              <Link href="/">
                <Home className="mr-2 size-4" aria-hidden="true" />
                Go Home
              </Link>
            </Button>
          </div>

          {/* Status link */}
          <div className="mt-8">
            <a
              href="https://status.britestate.co.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-body text-sm font-medium text-brand-primary underline-offset-4 hover:underline"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              Check our status page
            </a>
          </div>
        </div>
      </main>

      {/* Decorative dots */}
      <div className="flex justify-center py-6 opacity-30">
        <div className="flex gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="size-1.5 rounded-full bg-brand-primary"
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
