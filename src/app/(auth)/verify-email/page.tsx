"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Mail, Loader2, Shield, Lock, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { AuthLogo } from "@/components/auth/AuthLogo";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#f0f4f0] via-white to-[#e8f0ec] px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-lg md:p-10">
        {/* Logo */}
        <div className="flex justify-center">
          <AuthLogo />
        </div>

        {/* Animated Mail Icon with notification dot */}
        <div className="flex justify-center">
          <div className="relative flex size-24 items-center justify-center rounded-full bg-brand-primary-lighter">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-primary opacity-10" />
            <div className="relative flex size-16 items-center justify-center rounded-full bg-brand-primary">
              <Mail className="size-8 text-white" aria-hidden="true" />
            </div>
            {/* Notification dot */}
            <span
              className="absolute right-1 top-1 size-4 rounded-full border-2 border-white bg-amber-400"
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
                . Please click the link to confirm your account.
              </>
            ) : (
              "We've sent a verification link to your email address. Please click the link to confirm your account."
            )}
          </p>
        </div>

        {/* Open email app CTA */}
        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full bg-[#1B4D3E] text-white hover:bg-[#163d31]"
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

          <Button
            variant="outline"
            size="lg"
            className={cn(
              "w-full border-neutral-200 text-neutral-700 hover:bg-neutral-50",
              cooldown > 0 && "text-neutral-400",
            )}
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            aria-label={
              cooldown > 0
                ? `Resend verification email (available in ${cooldown} seconds)`
                : "Resend verification email"
            }
          >
            {resending ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Sending...
              </>
            ) : cooldown > 0 ? (
              <>
                <RotateCcw className="size-4" aria-hidden="true" />
                Resend link ({cooldown}s)
              </>
            ) : (
              <>
                <RotateCcw className="size-4" aria-hidden="true" />
                Resend link
              </>
            )}
          </Button>
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
          <span className="flex items-center gap-1 text-[10px] uppercase tracking-[0.15em] text-[#9ca3af]">
            <Lock className="size-3 shrink-0" aria-hidden="true" />
            Secure Verification
          </span>
          <span className="text-[#d1d5db]" aria-hidden="true">•</span>
          <span className="flex items-center gap-1 text-[10px] uppercase tracking-[0.15em] text-[#9ca3af]">
            <Shield className="size-3 shrink-0" aria-hidden="true" />
            End-to-End Encrypted
          </span>
        </div>
      </div>
    </div>
  );
}
