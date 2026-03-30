import { Suspense } from "react";
import { ShieldCheck } from "lucide-react";
import { TwoFactorForm } from "@/components/auth/TwoFactorForm";

export const metadata = {
  title: "Two-Factor Authentication - Britestate",
};

export default function TwoFactorPage() {
  return (
    <div className="space-y-8">
      {/* Header with icon */}
      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-primary">
            <ShieldCheck className="size-8 text-white" aria-hidden="true" />
          </div>
        </div>
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold text-neutral-900">
            Two-factor authentication
          </h1>
          <p className="mt-2 font-sans text-sm text-neutral-500">
            Enter the 6-digit code from your authenticator app to continue
          </p>
        </div>
      </div>

      <Suspense>
        <TwoFactorForm />
      </Suspense>
    </div>
  );
}
