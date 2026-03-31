import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { AuthDecorativeBackground } from "@/components/auth/AuthDecorativeBackground";
import { AuthBrandIcon } from "@/components/auth/AuthBrandIcon";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthFooter } from "@/components/auth/AuthFooter";

export const metadata = {
  title: "Sign In - Britestate",
  description: "Sign in to your Britestate account",
};

export default function LoginPage() {
  return (
    <div className="fixed inset-0 z-50 flex min-h-screen flex-col overflow-hidden bg-surface overflow-y-auto">
      <AuthDecorativeBackground />

      {/* Centered content */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-[440px] space-y-6">
          {/* Brand icon */}
          <AuthBrandIcon />

          {/* Heading */}
          <div className="text-center">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-brand-primary">
              Welcome back
            </h1>
            <p className="mt-2 font-sans text-sm text-neutral-500">
              Manage your property portfolio with ease
            </p>
          </div>

          {/* Card wrapping OAuth + divider + form */}
          <AuthCard className="space-y-6">
            {/* OAuth buttons */}
            <OAuthButtons />

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-neutral-200/50" />
              <span className="font-sans text-xs font-semibold uppercase tracking-widest text-neutral-400">
                or
              </span>
              <div className="h-px flex-1 bg-neutral-200/50" />
            </div>

            {/* Email/password form */}
            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>
          </AuthCard>

          {/* Sign up link */}
          <p className="text-center font-sans text-sm text-neutral-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-bold text-brand-primary hover:underline underline-offset-2 transition-colors"
            >
              Create an account
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <div className="relative z-10 pb-10 text-center">
        <AuthFooter variant="centered" />
      </div>
    </div>
  );
}
