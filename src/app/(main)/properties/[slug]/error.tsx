"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, Search, RefreshCw } from "lucide-react";

export default function PropertyDetailError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-lg space-y-8 rounded-2xl border border-brand-primary/10 bg-white p-8 shadow-sm">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-brand-primary/10">
            <AlertCircle className="size-8 text-brand-primary" aria-hidden="true" />
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-3 text-center">
          <h1 className="font-heading text-2xl font-bold text-neutral-900">
            Something went wrong
          </h1>
          <p className="text-neutral-600">
            We couldn&apos;t load this property. This might be temporary — please try again.
          </p>

          {/* Error Digest (debugging) */}
          {error.digest && (
            <p className="mt-4 font-mono text-xs text-neutral-400">
              ref: {error.digest}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={reset}
            size="lg"
            className="w-full bg-brand-primary text-white hover:bg-brand-primary/90"
          >
            <RefreshCw className="mr-2 size-5" aria-hidden="true" />
            Try Again
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full"
          >
            <Link href="/search">
              <Search className="mr-2 size-5" aria-hidden="true" />
              Back to Search
            </Link>
          </Button>
        </div>

        {/* Secondary Link */}
        <div className="border-t border-neutral-100 pt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-primary transition-colors hover:text-brand-primary/80"
          >
            <Home className="size-4" aria-hidden="true" />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
