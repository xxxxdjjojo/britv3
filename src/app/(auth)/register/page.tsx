import { Suspense } from "react";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { OAuthButtons } from "@/components/auth/OAuthButtons";

export const metadata = {
  title: "Create Account - Britestate",
  description: "Create your Britestate account",
};

export default function RegisterPage() {
  return (
    <div className="space-y-7">
      {/* Heading */}
      <div>
        <h1 className="font-heading text-3xl font-bold text-neutral-900 leading-tight">
          Create your account
        </h1>
        <p className="mt-1.5 font-sans text-sm text-neutral-500">
          Find, buy, rent or sell — all in one place
        </p>
      </div>

      {/* Social login */}
      <OAuthButtons />

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-neutral-200" />
        <span className="font-sans text-xs font-medium text-neutral-400 uppercase tracking-wide">
          or
        </span>
        <div className="h-px flex-1 bg-neutral-200" />
      </div>

      {/* Email/password form */}
      <Suspense>
        <RegisterForm />
      </Suspense>

      {/* Sign in link */}
      <p className="text-center font-sans text-sm text-neutral-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-primary hover:underline underline-offset-2 transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
