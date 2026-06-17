"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

const SUSPENSION_REASONS: Record<string, string> = {
  fraud_violation: "Your account was suspended due to suspected fraudulent activity.",
  terms_violation: "Your account was suspended for violating our Terms of Service.",
  payment_dispute: "Your account was suspended due to an unresolved payment dispute.",
  manual_review: "Your account is under manual review by our team.",
};

function AccountSuspendedContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") ?? "manual_review";
  const reason = SUSPENSION_REASONS[code] ?? SUSPENSION_REASONS.manual_review;

  return (
    <div className="space-y-6">
      {/* Icon */}
      <div className="flex justify-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-error/10">
          <ShieldAlert className="size-8 text-error" />
        </div>
      </div>

      {/* Heading + description */}
      <div className="text-center">
        <h1 className="font-heading text-2xl font-bold text-brand-primary-dark">
          Your account has been suspended
        </h1>
        <p className="mt-2 font-body text-sm text-neutral-500">
          {reason}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Button asChild size="lg" className="w-full">
          <a href="mailto:support@britestate.co.uk">Contact Support</a>
        </Button>
        <Button asChild variant="outline" size="lg" className="w-full">
          <a href="mailto:appeals@britestate.co.uk">Appeal This Decision</a>
        </Button>
      </div>

      {/* Footer */}
      <div className="space-y-2 text-center">
        <p className="font-body text-xs text-neutral-400">
          Please contact our support team to appeal this decision.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/legal/terms" className="font-body text-xs text-neutral-400 underline hover:text-neutral-600">
            Terms of Service
          </Link>
          <Link href="/legal/privacy" className="font-body text-xs text-neutral-400 underline hover:text-neutral-600">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AccountSuspendedPage() {
  return (
    <Suspense>
      <AccountSuspendedContent />
    </Suspense>
  );
}
