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
          Create your account
        </h1>
        <p className="mt-1 font-body text-sm text-neutral-500">
          Join Britestate to find your perfect property
        </p>
      </div>

      <OAuthButtons />
      <RegisterForm />

      <p className="text-center font-body text-sm text-neutral-500">
        Already have an account?{" "}
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
