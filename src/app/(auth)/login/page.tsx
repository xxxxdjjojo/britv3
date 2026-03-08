import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { OAuthButtons } from "@/components/auth/OAuthButtons";

export const metadata = {
  title: "Sign In - Britestate",
  description: "Sign in to your Britestate account",
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-heading text-2xl font-bold text-neutral-900">
          Welcome back
        </h1>
      </div>

      <LoginForm />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-neutral-200" />
        <span className="font-body text-xs text-neutral-500">OR</span>
        <div className="h-px flex-1 bg-neutral-200" />
      </div>

      <OAuthButtons />

      <p className="text-center font-body text-sm text-neutral-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-brand-accent hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
