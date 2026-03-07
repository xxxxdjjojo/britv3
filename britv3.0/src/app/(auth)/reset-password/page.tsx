import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata = {
  title: "Set New Password - Britestate",
  description: "Set a new password for your Britestate account",
};

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-heading text-2xl font-bold text-neutral-900">
          Set new password
        </h1>
        <p className="mt-1 font-body text-sm text-neutral-500">
          Choose a strong password for your account
        </p>
      </div>

      <ResetPasswordForm />
    </div>
  );
}
