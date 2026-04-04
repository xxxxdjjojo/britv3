"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Mail, Loader2, Shield, Lock, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { AuthLogo } from "@/components/auth/AuthLogo";
import { AuthDecorativeBackground } from "@/components/auth/AuthDecorativeBackground";

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data?.user?.email ?? null);
    });
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = useCallback(async () => {
    if (!email || cooldown > 0) return;
    setResending(true);
    setResendSuccess(false);
    try {
      const supabase = createClient();
      await supabase.auth.resend({
        type: "signup",
        email,
      });
      setResendSuccess(true);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } finally {
      setResending(false);
    }
  }, [email, cooldown]);

  return (
    <div className="fixed inset-0 z-50 min-h-screen bg-surface overflow-hidden flex flex-col items-center justify-center px-4 py-12 overflow-y-auto">
      <AuthDecorativeBackground />

      {/* Logo */}
      <div className="relative z-10 mb-8 flex justify-center">
        <AuthLogo />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-8 shadow-lg md:p-10 space-y-6">

        {/* Mail icon — rounded-xl square, bg-brand-primary, gold dot */}
        <div className="flex justify-center">
          <div className="relative inline-flex size-16 items-center justify-center rounded-xl bg-brand-primary">
            <Mail className="size-8 text-white" aria-hidden="true" />
            {/* Gold notification dot */}
            <span
              className="absolute -right-1.5 -top-1.5 size-4 rounded-full border-2 border-white bg-brand-secondary"
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Heading + description */}
        <div className="space-y-3 text-center">
          <h1 className="font-heading text-3xl font-bold text-neutral-900">
            Check your email
          </h1>
          <p className="font-sans text-base text-neutral-600">
            {email ? (
              <>
                We&apos;ve sent a verification link to{" "}
                <span className="font-semibold text-brand-primary">{email}</span>
                . Please click the link to confirm your account and start
                managing your properties.
              </>
            ) : (
              "We've sent a verification link to your email address. Please click the link to confirm your account and start managing your properties."
            )}
          </p>
        </div>

        {/* Open email app CTA */}
        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full rounded-xl bg-brand-primary py-3.5 text-white hover:bg-brand-primary/90"
            asChild
            aria-label="Open your email app"
          >
            <a href="mailto:" rel="noopener noreferrer">
              <Mail className="size-4" aria-hidden="true" />
              Open Email App
            </a>
          </Button>

          {/* Resend section */}
          {resendSuccess && (
            <p className="text-center text-sm font-medium text-success">
              Verification email sent again!
            </p>
          )}

          <p className="text-center text-sm text-neutral-500">
            Didn&apos;t receive the email?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              aria-label={
                cooldown > 0
                  ? `Resend verification email (available in ${cooldown} seconds)`
                  : "Resend verification email"
              }
              className={cn(
                "font-medium",
                resending || cooldown > 0
                  ? "cursor-not-allowed text-neutral-400"
                  : "text-brand-primary hover:underline",
              )}
            >
              {resending ? (
                <span className="inline-flex items-center gap-1">
                  <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                  Sending...
                </span>
              ) : cooldown > 0 ? (
                <span className="inline-flex items-center gap-1">
                  <RotateCcw className="size-3" aria-hidden="true" />
                  Resend link ({Math.floor(cooldown / 60)}:
                  {String(cooldown % 60).padStart(2, "0")})
                </span>
              ) : (
                "Resend link"
              )}
            </button>
          </p>
        </div>

        {/* Change email link */}
        <p className="text-center font-sans text-sm text-neutral-500">
          <Link
            href="/register"
            className="font-medium text-brand-accent hover:underline"
            aria-label="Go back to register with a different email address"
          >
            ← Change email address
          </Link>
        </p>

        {/* Security footer badges */}
        <div className="flex items-center justify-center gap-3 pt-1">
          <span className="flex items-center gap-1 text-[10px] uppercase tracking-[0.15em] text-neutral-400">
            <Lock className="size-3 shrink-0" aria-hidden="true" />
            Secure Verification
          </span>
          <span className="text-neutral-300" aria-hidden="true">•</span>
          <span className="flex items-center gap-1 text-[10px] uppercase tracking-[0.15em] text-neutral-400">
            <Shield className="size-3 shrink-0" aria-hidden="true" />
            End-to-End Encrypted
          </span>
        </div>
      </div>
    </div>
  );
}
