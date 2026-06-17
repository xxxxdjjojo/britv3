"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Clock, KeyRound, ShieldOff } from "lucide-react";
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

  const unlockTime = until
    ? new Date(until).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZoneName: "short" })
    : null;

  return (
    <div className="space-y-6">
      {/* Icon */}
      <div className="flex justify-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-primary">
          <ShieldOff className="size-8 text-white" />
        </div>
      </div>

      {/* Heading + description */}
      <div className="text-center">
        <h1 className="font-heading text-2xl font-bold text-brand-primary-dark">
          Your account is temporarily locked
        </h1>
        <p className="mt-2 font-body text-sm text-neutral-500">
          Too many failed sign-in attempts triggered an automatic lock.
        </p>
      </div>

      {/* Info bullets */}
      <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
        <ul className="space-y-3">
          {!expired && (
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                <Clock className="size-4 text-neutral-500" />
              </span>
              <div>
                <p className="font-body text-sm font-medium text-neutral-800">
                  Try again in {minutes} minute{minutes !== 1 ? "s" : ""}
                </p>
                {unlockTime && (
                  <p className="font-body text-xs text-neutral-400">
                    The lock will automatically expire at {unlockTime}
                  </p>
                )}
                {!unlockTime && (
                  <p className="font-body text-xs text-neutral-400">
                    Remaining: {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                  </p>
                )}
              </div>
            </li>
          )}

          {expired && (
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-success/10">
                <Clock className="size-4 text-success" />
              </span>
              <div>
                <p className="font-body text-sm font-medium text-success">
                  Your account is now unlocked. You can sign in again.
                </p>
              </div>
            </li>
          )}

          <li className="flex items-start gap-3">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
              <KeyRound className="size-4 text-neutral-500" />
            </span>
            <div>
              <p className="font-body text-sm font-medium text-neutral-800">
                Immediate access needed?
              </p>
              <p className="font-body text-xs text-neutral-400">
                Resetting your password will verify your identity and unlock your account instantly.
              </p>
            </div>
          </li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Button asChild size="lg" className="w-full">
          <Link href="/forgot-password">Reset Password Instead</Link>
        </Button>
        {expired ? (
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link href="/login">Try Again</Link>
          </Button>
        ) : (
          <Button variant="outline" size="lg" className="w-full" disabled>
            Try Again Later
          </Button>
        )}
      </div>

      {/* Footer */}
      <p className="text-center font-body text-xs text-neutral-400">
        Contact{" "}
        <a
          href="mailto:support@britestate.co.uk"
          className="underline hover:text-neutral-600"
        >
          support@britestate.co.uk
        </a>{" "}
        if you need immediate help.
      </p>
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
