"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

function AccountSuspendedContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason") ?? "Your account has been suspended by an administrator.";

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
        <Button asChild size="lg">
          <a href="mailto:support@britestate.co.uk">Contact Support</a>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <a href="mailto:appeals@britestate.co.uk">Appeal This Decision</a>
        </Button>
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
