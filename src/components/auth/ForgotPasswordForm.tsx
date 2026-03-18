"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { resetPassword } from "@/services/auth/auth-service";
import { handleSupabaseError } from "@/lib/supabase-error";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function onSubmit(data: ForgotPasswordFormValues) {
    setError(null);
    const { error: authError } = await resetPassword(data.email);
    if (authError) {
      setError(handleSupabaseError(authError).message);
      return;
    }
    setSubmittedEmail(data.email);
    setSubmitted(true);
    setCooldown(60);
  }

  if (submitted) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-green-50">
          <Mail className="size-6 text-brand-primary" />
        </div>
        <div>
          <h3 className="font-heading text-lg font-semibold text-neutral-900">Check your inbox</h3>
          <p className="mt-1 font-body text-sm text-neutral-500">
            We sent a reset link to{" "}
            <strong className="text-neutral-900">{submittedEmail}</strong>
          </p>
        </div>
        <p className="font-body text-xs text-neutral-400">
          {cooldown > 0 ? (
            `Resend available in ${cooldown}s`
          ) : (
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setCooldown(0);
              }}
              className="text-brand-accent hover:underline"
            >
              Didn&apos;t receive it? Try again
            </button>
          )}
        </p>
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
