import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata = {
  title: "Reset Password - TrueDeed",
  description: "Reset your TrueDeed account password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-heading text-2xl font-bold text-neutral-900">
          Reset your password
        </h1>
        <p className="mt-1 font-body text-sm text-neutral-500">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <ForgotPasswordForm />

      <p className="text-center font-body text-sm text-neutral-500">
        <Link
          href="/login"
          className="font-medium text-brand-accent hover:underline"
        >
          Back to login
        </Link>
      </p>
    </div>
  );
}
