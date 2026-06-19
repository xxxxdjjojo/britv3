import { Suspense } from "react";
import { TwoFactorForm } from "@/components/auth/TwoFactorForm";

export const metadata = {
  title: "Two-Factor Authentication - TrueDeed",
};

export default function TwoFactorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-neutral-900">
          Enter verification code
        </h1>
        <p className="mt-1 font-body text-sm text-neutral-500">
          Open your authenticator app and enter the 6-digit code
        </p>
      </div>
      <Suspense>
        <TwoFactorForm />
      </Suspense>
    </div>
  );
}
