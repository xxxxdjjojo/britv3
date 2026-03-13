"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { updatePassword } from "@/services/auth/auth-service";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");

  async function onSubmit(data: ResetPasswordFormValues) {
    setError(null);
    const { error: authError } = await updatePassword(data.password);
    if (authError) {
      setError(authError.message);
      return;
    }
    router.push("/login?message=password-updated");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* New Password */}
      <div className="space-y-2">
        <Label htmlFor="new-password">New password</Label>
        <Input
          id="new-password"
          type="password"
          placeholder="Enter new password"
          className="h-10"
          aria-invalid={!!errors.password}
          {...register("password")}
        />
        {errors.password && (
          <p className="text-xs text-error">{errors.password.message}</p>
        )}
        <PasswordStrengthMeter password={password} />
        {/* Requirements checklist */}
        {password && (
          <ul className="space-y-1">
            {[
              { label: "At least 8 characters", met: password.length >= 8 },
              { label: "One uppercase letter", met: /[A-Z]/.test(password) },
              { label: "One number", met: /[0-9]/.test(password) },
            ].map((req) => (
              <li key={req.label} className="flex items-center gap-2 text-xs">
                <span
                  className={`inline-block size-3.5 rounded-full text-center leading-3.5 ${
                    req.met
                      ? "bg-brand-primary text-white"
                      : "border border-neutral-300"
                  }`}
                >
                  {req.met && "✓"}
                </span>
                <span className={req.met ? "text-neutral-700" : "text-neutral-400"}>
                  {req.label}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="confirm-new-password">Confirm new password</Label>
        <Input
          id="confirm-new-password"
          type="password"
          placeholder="Confirm new password"
          className="h-10"
          aria-invalid={!!errors.confirmPassword}
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="text-xs text-error">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Updating password...
          </>
        ) : (
          "Update Password"
        )}
      </Button>
    </form>
  );
}
