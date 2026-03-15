"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
    <div className="space-y-6 text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-error/10">
        <ShieldAlert className="size-8 text-error" />
      </div>

      <div>
        <h1 className="font-heading text-2xl font-bold text-neutral-900">
          Your account has been suspended
        </h1>
        <p className="mt-2 font-body text-sm text-neutral-500">
          {reason}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <a href="mailto:support@britestate.co.uk">
          <Button size="lg">Contact Support</Button>
        </a>
        <a href="mailto:appeals@britestate.co.uk">
          <Button variant="outline" size="lg">
            Appeal This Decision
          </Button>
        </a>
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
