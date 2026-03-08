import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { OAuthButtons } from "@/components/auth/OAuthButtons";

export const metadata = {
  title: "Create Account - Britestate",
  description: "Create your Britestate account",
};

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-heading text-2xl font-bold text-neutral-900">
          Create account
        </h1>
      </div>

      <RegisterForm />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-neutral-200" />
        <span className="font-body text-xs text-neutral-500">OR</span>
        <div className="h-px flex-1 bg-neutral-200" />
      </div>

      <OAuthButtons />

      <p className="text-center font-body text-sm text-neutral-500">
        Have a Britestate account?{" "}
        <Link
          href="/login"
          className="font-medium text-brand-accent hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
