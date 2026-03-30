"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { updatePassword } from "@/services/auth/auth-service";
import { handleSupabaseError } from "@/lib/supabase-error";

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      setError(handleSupabaseError(authError).message);
      return;
    }
    router.push("/login?message=password-updated");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* New Password */}
      <div className="space-y-1.5">
        <Label htmlFor="new-password" className="font-body text-sm font-medium text-neutral-700">
          New password
        </Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
          <Input
            id="new-password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter new password"
            className="h-11 pl-10 pr-11 rounded-lg border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-brand-primary/30 focus-visible:border-brand-primary"
            autoComplete="new-password"
            aria-label="New password"
            aria-invalid={!!errors.password}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
            aria-label={showPassword ? "Hide new password" : "Show new password"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-error" role="alert">{errors.password.message}</p>
        )}
        <PasswordStrengthMeter password={password} />

        {/* Requirements checklist */}
        {password && (
          <ul className="space-y-1.5 mt-2" aria-label="Password requirements">
            {[
              { label: "At least 8 characters", met: password.length >= 8 },
              { label: "One uppercase letter", met: /[A-Z]/.test(password) },
              { label: "One number", met: /[0-9]/.test(password) },
            ].map((req) => (
              <li key={req.label} className="flex items-center gap-2 text-xs">
                <CheckCircle2
                  className={`size-3.5 shrink-0 ${req.met ? "text-success" : "text-neutral-300"}`}
                  aria-hidden="true"
                />
                <span className={req.met ? "text-neutral-700" : "text-neutral-400"}>
                  {req.label}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-1.5">
        <Label htmlFor="confirm-new-password" className="font-body text-sm font-medium text-neutral-700">
          Confirm new password
        </Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
          <Input
            id="confirm-new-password"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm new password"
            className="h-11 pl-10 pr-11 rounded-lg border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-brand-primary/30 focus-visible:border-brand-primary"
            autoComplete="new-password"
            aria-label="Confirm new password"
            aria-invalid={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
          >
            {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-xs text-error" role="alert">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full h-11 rounded-lg bg-brand-primary font-semibold text-white hover:bg-brand-primary-light transition-colors shadow-sm"
        disabled={isSubmitting}
        aria-label={isSubmitting ? "Updating password…" : "Update password"}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Updating password…
          </>
        ) : (
          "Update Password"
        )}
      </Button>
    </form>
  );
}
