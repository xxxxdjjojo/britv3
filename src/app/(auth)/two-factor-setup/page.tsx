"use client";

import { useRouter } from "next/navigation";
import { TwoFactorSetupFlow } from "@/components/auth/TwoFactorSetupFlow";

export default function TwoFactorSetupPage() {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-neutral-900">
          Set up two-factor authentication
        </h1>
        <p className="mt-1 font-body text-sm text-neutral-500">
          Add an extra layer of security to your account
        </p>
      </div>
      <TwoFactorSetupFlow
        onComplete={() => router.push("/dashboard")}
        onSkip={() => router.push("/dashboard")}
      />
    </div>
  );
}
