import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { OAuthButtons } from "@/components/auth/OAuthButtons";

export const metadata = {
  title: "Sign In - Britestate",
  description: "Sign in to your Britestate account",
};

export default function LoginPage() {
  return (
    <div className="space-y-7">
      {/* Heading */}
      <div>
        <h1 className="font-heading text-3xl font-bold text-neutral-900 leading-tight">
          Welcome back
        </h1>
        <p className="mt-1.5 font-body text-sm text-neutral-500">
          Sign in to your account to continue
        </p>
      </div>

      {/* Social login */}
      <OAuthButtons />

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-neutral-200" />
        <span className="font-body text-xs font-medium text-neutral-400 uppercase tracking-wide">
          or
        </span>
        <div className="h-px flex-1 bg-neutral-200" />
      </div>

      {/* Email/password form */}
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>

      {/* Sign up link */}
      <p className="text-center font-body text-sm text-neutral-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-brand-primary hover:underline underline-offset-2 transition-colors">
          Create one
        </Link>
      </p>
    </div>
  );
}
