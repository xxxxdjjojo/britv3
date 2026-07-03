"use client";

export const dynamic = "force-static";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Gauge, Home, RefreshCw } from "lucide-react";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";

const COOLDOWN_SECONDS = 60;

export default function RateLimitedPage() {
  const [secondsLeft, setSecondsLeft] = useState(COOLDOWN_SECONDS);
  const [canRetry, setCanRetry] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- retry flag set once cooldown has elapsed
      setCanRetry(true);
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timer);
          setCanRetry(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const handleRetry = useCallback(() => {
    if (canRetry) {
      window.history.back();
    }
  }, [canRetry]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formatted =
    minutes > 0
      ? `${minutes}m ${seconds.toString().padStart(2, "0")}s`
      : `${seconds}s`;

  // Arc progress: 0 = full, 100 = empty
  const progress = (secondsLeft / COOLDOWN_SECONDS) * 100;
  const circumference = 2 * Math.PI * 45;
  const dashOffset = circumference * (1 - progress / 100);

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
          {/* Gauge icon with ring */}
          <div className="relative mb-8 flex items-center justify-center">
            <div className="absolute inset-0 scale-150 rounded-full bg-warning-light/60 blur-2xl" />
            {/* Countdown ring */}
            <svg
              className="relative -rotate-90"
              width="120"
              height="120"
              viewBox="0 0 100 100"
              aria-hidden="true"
            >
              {/* Track */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#FEF9C3"
                strokeWidth="6"
              />
              {/* Progress */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#CA8A04"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <Gauge
                className="size-8 text-warning"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Text */}
          <div className="space-y-3">
            <h1 className="font-heading text-3xl font-bold text-neutral-900 md:text-4xl">
              Too many requests
            </h1>
            <p className="text-lg leading-relaxed text-neutral-600">
              You&apos;ve made too many requests in a short time. Please wait
              before trying again.
            </p>
          </div>

          {/* Countdown */}
          {!canRetry && (
            <div className="mx-auto mt-8 flex w-fit flex-col items-center rounded-xl bg-warning-light px-8 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-warning">
                Try again in
              </p>
              <p
                className="font-heading text-4xl font-bold text-warning"
                aria-live="polite"
                aria-atomic="true"
              >
                {formatted}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-10 flex flex-col gap-3">
            <Button
              size="lg"
              className="h-14 w-full text-base font-bold"
              onClick={handleRetry}
              disabled={!canRetry}
            >
              <RefreshCw className="mr-2 size-5" aria-hidden="true" />
              {canRetry ? "Try Again" : `Wait ${formatted}`}
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

          <p className="mt-6 text-xs text-neutral-400">
            Rate limiting protects our platform for everyone. If you believe
            this is an error, please{" "}
            <Link
              href="/help"
              className="text-brand-primary underline-offset-2 hover:underline"
            >
              contact support
            </Link>
            .
          </p>
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
