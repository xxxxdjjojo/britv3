"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, Mail, ArrowLeft, AlertTriangle } from "lucide-react";
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
    <div className="space-y-8">
      {/* Icon + Heading */}
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-error-light">
          <ShieldAlert className="size-10 text-error" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-neutral-900">
            Your account has been suspended
          </h1>
          <p className="text-sm leading-relaxed text-neutral-600">{reason}</p>
        </div>
      </div>

      {/* Info box */}
      <div className="rounded-xl border border-error/10 bg-error-light/30 px-5 py-4">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-error" aria-hidden="true" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-neutral-900">What this means</p>
            <p className="text-xs leading-relaxed text-neutral-600">
              You cannot access your account or any of its features while suspended.
              Our support team can help resolve this — please contact us or submit an appeal.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Button
          asChild
          size="lg"
          className="h-12 w-full bg-brand-primary text-white hover:bg-brand-primary-light"
          aria-label="Contact support about your suspension"
        >
          <a href="mailto:support@britestate.co.uk">
            <Mail className="mr-2 size-4" aria-hidden="true" />
            Contact Support
          </a>
        </Button>
        <Button
          asChild
          variant="outline"
          size="lg"
          className="h-12 w-full border-neutral-200 text-neutral-700 hover:bg-neutral-50"
          aria-label="Appeal this suspension decision"
        >
          <a href="mailto:appeals@britestate.co.uk">Appeal This Decision</a>
        </Button>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-neutral-500 hover:text-neutral-700"
          aria-label="Go back to sign in"
        >
          <Link href="/login">
            <ArrowLeft className="mr-1.5 size-3.5" aria-hidden="true" />
            Back to Sign In
          </Link>
        </Button>
      </div>

      {/* Reference ID */}
      <p className="text-center text-xs text-neutral-400">
        Reference code:{" "}
        <span className="font-mono font-medium text-neutral-600">{code.toUpperCase()}</span>
      </p>
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
