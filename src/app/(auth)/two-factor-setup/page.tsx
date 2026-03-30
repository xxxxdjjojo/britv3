"use client";

import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import { TwoFactorSetupFlow } from "@/components/auth/TwoFactorSetupFlow";

export default function TwoFactorSetupPage() {
  const router = useRouter();
  return (
    <div className="space-y-8">
      {/* Header with icon */}
      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-primary">
            <Shield className="size-8 text-white" aria-hidden="true" />
          </div>
        </div>
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold text-neutral-900">
            Set up two-factor authentication
          </h1>
          <p className="mt-2 font-sans text-sm text-neutral-500">
            Add an extra layer of security to your account. We&apos;ll walk you
            through each step.
          </p>
        </div>
      </div>

      <TwoFactorSetupFlow
        onComplete={() => router.push("/dashboard")}
        onSkip={() => router.push("/dashboard")}
      />
    </div>
  );
}
