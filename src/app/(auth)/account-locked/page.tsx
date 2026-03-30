"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldOff, KeyRound, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

function AccountLockedContent() {
  const searchParams = useSearchParams();
  const until = searchParams.get("until");

  const [secondsLeft, setSecondsLeft] = useState(() => {
    if (!until) return 30 * 60; // default 30 min
    const diff = Math.floor((new Date(until).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  });

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const expired = secondsLeft === 0;

  return (
    <div className="space-y-8">
      {/* Icon */}
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-warning-light">
          <ShieldOff className="size-10 text-warning" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-neutral-900">
            Account temporarily locked
          </h1>
          <p className="text-sm leading-relaxed text-neutral-600">
            Too many failed sign-in attempts triggered an automatic security lock
            to protect your account.
          </p>
        </div>
      </div>

      {/* Countdown / Unlocked state */}
      {!expired ? (
        <div className="rounded-xl border border-warning/20 bg-warning-light/40 px-6 py-5 text-center">
          <div className="mb-1 flex items-center justify-center gap-2 text-warning">
            <Lock className="size-4" aria-hidden="true" />
            <p className="text-xs font-medium uppercase tracking-widest">
              Try again in
            </p>
          </div>
          <p
            className="font-heading text-4xl font-bold tabular-nums text-neutral-900"
            aria-live="polite"
            aria-label={`${minutes} minutes and ${seconds} seconds remaining`}
          >
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-success/20 bg-success-light px-6 py-4 text-center">
          <p className="text-sm font-medium text-success">
            Your account is now unlocked. You can sign in again.
          </p>
        </div>
      )}

      {/* Security badge */}
      <div className="flex items-center justify-center gap-2 rounded-lg bg-neutral-50 px-4 py-3">
        <ShieldOff className="size-4 text-neutral-400" aria-hidden="true" />
        <p className="text-xs text-neutral-500">
          Encrypted Session · Automatic security protection active
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Button
          asChild
          size="lg"
          className="h-12 w-full bg-brand-primary text-white hover:bg-brand-primary-light"
          aria-label="Reset your password"
        >
          <Link href="/forgot-password">
            <KeyRound className="mr-2 size-4" aria-hidden="true" />
            Reset Password
            <ArrowRight className="ml-auto size-4" aria-hidden="true" />
          </Link>
        </Button>
        {expired ? (
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 w-full border-neutral-200 text-neutral-700 hover:bg-neutral-50"
            aria-label="Try signing in again"
          >
            <Link href="/login">Try Again</Link>
          </Button>
        ) : (
          <Button
            variant="outline"
            size="lg"
            disabled
            className="h-12 w-full border-neutral-200 text-neutral-400"
            aria-label="Sign in is disabled while account is locked"
            aria-disabled="true"
          >
            Try Again Later
          </Button>
        )}
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-neutral-500 hover:text-neutral-700"
          aria-label="Contact support for help"
        >
          <Link href="mailto:support@britestate.co.uk">Contact Support</Link>
        </Button>
      </div>
    </div>
  );
}

export default function AccountLockedPage() {
  return (
    <Suspense>
      <AccountLockedContent />
    </Suspense>
  );
}
