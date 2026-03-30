import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata = {
  title: "Reset Password - Britestate",
  description: "Reset your Britestate account password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="space-y-7">
      {/* Heading */}
      <div>
        <h1 className="font-heading text-3xl font-bold text-neutral-900 leading-tight">
          Reset your password
        </h1>
        <p className="mt-1.5 font-sans text-sm text-neutral-500">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <ForgotPasswordForm />

      <p className="text-center font-sans text-sm text-neutral-500">
        Remember your password?{" "}
        <Link
          href="/login"
          className="font-semibold text-brand-accent hover:underline underline-offset-2 transition-colors"
          aria-label="Back to sign in"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
