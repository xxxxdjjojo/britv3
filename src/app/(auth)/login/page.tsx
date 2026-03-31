import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { AuthLogo } from "@/components/auth/AuthLogo";

export const metadata = {
  title: "Sign In - Britestate",
  description: "Sign in to your Britestate account",
};

export default function LoginPage() {
  return (
    <div className="fixed inset-0 z-50 flex min-h-screen flex-col bg-gradient-to-br from-[#faf9f8] via-white to-[#f4f3f2] overflow-y-auto">
      {/* Logo centered at top */}
      <header className="flex shrink-0 justify-center px-6 pt-10">
        <AuthLogo />
      </header>

      {/* Centered form content */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-[460px] space-y-7">
          {/* Heading */}
          <div className="text-center">
            <h1 className="font-heading text-3xl font-bold text-neutral-900 leading-tight">
              Welcome back
            </h1>
            <p className="mt-1.5 font-sans text-sm text-neutral-500">
              Manage your property portfolio with ease
            </p>
          </div>

          {/* Social login — side by side */}
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
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>

          {/* Sign up link */}
          <p className="text-center font-sans text-sm text-neutral-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-brand-primary hover:underline underline-offset-2 transition-colors"
            >
              Create an account
            </Link>
          </p>
        </div>
      </main>

      {/* Page footer */}
      <footer className="flex shrink-0 flex-col items-center gap-2 px-6 pb-10 text-center">
        <p className="font-sans text-xs text-neutral-400">
          © 2024 Britestate. Secure encrypted authentication.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/privacy"
            className="font-sans text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            Privacy Policy
          </Link>
          <span className="text-neutral-300" aria-hidden="true">·</span>
          <Link
            href="/terms"
            className="font-sans text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            Terms of Service
          </Link>
        </div>
      </footer>
    </div>
  );
}
