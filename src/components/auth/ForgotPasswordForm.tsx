"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
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
      <div className="space-y-5">
        {/* Success card */}
        <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-6 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-brand-primary/10">
            <CheckCircle2 className="size-7 text-brand-primary" aria-hidden="true" />
          </div>
          <h3 className="font-heading text-lg font-semibold text-neutral-900">
            Check your inbox
          </h3>
          <p className="mt-2 font-body text-sm text-neutral-500 leading-relaxed">
            We&apos;ve sent a reset link to{" "}
            <strong className="font-semibold text-neutral-900">{submittedEmail}</strong>
          </p>
          <p className="mt-1 font-body text-xs text-neutral-400">
            Didn&apos;t get it? Check your spam folder.
          </p>
        </div>

        {/* Resend / try again */}
        <div className="text-center">
          {cooldown > 0 ? (
            <p className="font-body text-sm text-neutral-400">
              Resend available in{" "}
              <span className="font-medium text-neutral-600">{cooldown}s</span>
            </p>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setCooldown(0);
              }}
              className="font-body text-sm font-medium text-brand-accent hover:underline underline-offset-2 transition-colors"
              aria-label="Try again with a different email"
            >
              Didn&apos;t receive it? Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="forgot-email" className="font-body text-sm font-medium text-neutral-700">
          Email address
        </Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
          <Input
            id="forgot-email"
            type="email"
            placeholder="you@example.com"
            className="h-11 pl-10 rounded-lg border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus-visible:ring-brand-primary/30 focus-visible:border-brand-primary"
            autoComplete="email"
            aria-label="Email address"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </div>
        {errors.email && (
          <p className="text-xs text-error" role="alert">{errors.email.message}</p>
        )}
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full h-11 rounded-lg bg-brand-primary font-semibold text-white hover:bg-brand-primary-light transition-colors shadow-sm"
        disabled={isSubmitting}
        aria-label={isSubmitting ? "Sending reset link…" : "Send reset link"}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Sending…
          </>
        ) : (
          <>
            Send Reset Link
            <ArrowRight className="size-4" aria-hidden="true" />
          </>
        )}
      </Button>
    </form>
  );
}
