import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata = {
  title: "Create New Password - Britestate",
  description: "Create a new password for your Britestate account",
};

export default function ResetPasswordPage() {
  return (
    <div className="space-y-7">
      {/* Heading */}
      <div>
        <h2 className="font-heading text-3xl font-bold text-neutral-900 leading-tight">
          Create a new password
        </h2>
        <p className="mt-1.5 font-body text-sm text-neutral-500">
          Choose a strong password to keep your account secure
        </p>
      </div>

      <ResetPasswordForm />
    </div>
  );
}
