"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldOff } from "lucide-react";
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
    <div className="space-y-6 text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-warning/10">
        <ShieldOff className="size-8 text-warning" />
      </div>

      <div>
        <h1 className="font-heading text-2xl font-bold text-neutral-900">
          Your account is temporarily locked
        </h1>
        <p className="mt-2 font-body text-sm text-neutral-500">
          Too many failed sign-in attempts triggered an automatic lock.
        </p>
      </div>

      {!expired && (
        <div className="rounded-xl bg-neutral-50 px-6 py-4">
          <p className="font-body text-sm text-neutral-500">Locked for</p>
          <p className="font-heading text-3xl font-bold text-neutral-900">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </p>
        </div>
      )}

      {expired && (
        <p className="font-body text-sm font-medium text-success">
          Your account is now unlocked. You can sign in again.
        </p>
      )}

      <div className="flex flex-col gap-3">
        <Link href="/forgot-password">
          <Button size="lg">Reset Password Instead</Button>
        </Link>
        {expired ? (
          <Link href="/login">
            <Button variant="outline" size="lg">
              Try Again
            </Button>
          </Link>
        ) : (
          <Button variant="outline" size="lg" disabled>
            Try Again Later
          </Button>
        )}
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
