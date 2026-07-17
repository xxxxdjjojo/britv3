/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Wrench, RefreshCw, Home, Activity } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { captureException } from "@/lib/observability/capture-exception";

export default function ErrorPage({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  useEffect(() => {
    captureException(error, {
      module: "app",
      feature: "error-boundary",
      operation: "app-error",
      extra: { digest: error.digest },
    });
    console.error("[ErrorBoundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col bg-neutral-50">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="flex items-center justify-between border-b border-brand-primary/10 bg-white px-6 py-5 lg:px-10">
        <Logo />
        <Button asChild size="sm" variant="ghost">
          <Link href="/help">Help</Link>
        </Button>
      </header>

      {/* ── Main ───────────────────────────────────────────────── */}
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-brand-primary/5 bg-white p-8 text-center shadow-sm md:p-12">
          {/* Illustration */}
          <div className="relative mb-8 flex items-center justify-center">
            <div className="absolute inset-0 scale-150 rounded-full bg-brand-primary/5 blur-2xl" />
            <div className="relative flex size-32 items-center justify-center rounded-full bg-brand-primary-lighter text-brand-primary md:size-40">
              <Wrench className="size-14 md:size-16" aria-hidden="true" />
            </div>
          </div>

          {/* Text */}
          <div className="space-y-3">
            <h1 className="font-heading text-3xl font-bold text-neutral-900 md:text-4xl">
              Something went wrong
            </h1>
            <p className="text-lg leading-relaxed text-neutral-600">
              We&apos;re working on fixing this. Please try again in a moment.
            </p>
            {error.digest && (
              <p className="font-mono text-xs text-neutral-400">
                ref: {error.digest}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="mt-10 flex flex-col gap-3">
            <Button
              size="lg"
              className="h-14 w-full text-base font-bold shadow-lg shadow-brand-primary/20"
              onClick={reset}
            >
              <RefreshCw className="mr-2 size-5" aria-hidden="true" />
              Try Again
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-14 w-full text-base font-bold"
            >
              <Link href="/">
                <Home className="mr-2 size-5" aria-hidden="true" />
                Go Home
              </Link>
            </Button>
          </div>

          {/* Status link */}
          <div className="mt-8">
            <Link
              href="/status"
              className="inline-flex items-center gap-2 font-medium text-brand-primary underline-offset-4 hover:underline"
            >
              <Activity className="size-4" aria-hidden="true" />
              Check our status page
            </Link>
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
