"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Loader2, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { resetPassword } from "@/services/auth/auth-service";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordFormValues) {
    setError(null);
    const { error: authError } = await resetPassword(data.email);
    if (authError) {
      setError(authError.message);
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-brand-primary-lighter">
            <Mail className="size-8 text-brand-primary" />
          </div>
        </div>
        <div>
          <h2 className="font-heading text-lg font-semibold text-neutral-900">
            Check your email
          </h2>
          <p className="mt-1 font-body text-sm text-neutral-500">
            We sent a password reset link to your email address. Click the link
            to set a new password.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="forgot-email">Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
          <Input
            id="forgot-email"
            type="email"
            placeholder="you@example.com"
            className="h-10 pl-9"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </div>
        {errors.email && (
          <p className="text-xs text-error">{errors.email.message}</p>
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
            Sending...
          </>
        ) : (
          "Send Reset Link"
        )}
      </Button>
    </form>
  );
}
