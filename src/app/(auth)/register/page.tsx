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
      <div>
        <h1 className="font-heading text-2xl font-bold text-neutral-900">
          Create your account
        </h1>
        <p className="mt-1 font-body text-sm text-neutral-500">
          Find, buy, rent or sell — all in one place
        </p>
      </div>

      <OAuthButtons />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-neutral-200" />
        <span className="font-body text-xs text-neutral-500">or sign up with email</span>
        <div className="h-px flex-1 bg-neutral-200" />
      </div>

      <RegisterForm />

      <p className="text-center font-body text-sm text-neutral-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
