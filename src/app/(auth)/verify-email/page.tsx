"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Mail, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  browserAuthCallbackUrl,
  PENDING_SIGNUP_EMAIL_KEY,
} from "@/lib/auth/signup-confirmation";

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const pendingEmail = window.localStorage.getItem(PENDING_SIGNUP_EMAIL_KEY);
    if (pendingEmail) {
      setEmail(pendingEmail);
      return;
    }

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
        options: {
          emailRedirectTo: browserAuthCallbackUrl(),
        },
      });
      setResendSuccess(true);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } finally {
      setResending(false);
    }
  }, [email, cooldown]);

  return (
    <div className="space-y-6 text-center">
      {/* Animated Mail Icon */}
      <div className="flex justify-center">
        <div
          className={cn(
            "relative flex size-20 items-center justify-center rounded-full",
            "bg-brand-primary-lighter",
          )}
        >
          {/* Pulsing ring */}
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-primary opacity-10" />
          <Mail className="relative size-10 animate-bounce text-brand-primary" />
        </div>
      </div>

      {/* Heading + description */}
      <div className="space-y-2">
        <h2 className="font-heading text-2xl font-bold text-neutral-900">
          Check your email
        </h2>
        <p className="font-body text-sm text-neutral-500">
          {email ? (
            <>
              We&apos;ve sent a verification link to{" "}
              <span className="font-semibold text-brand-primary">{email}</span>
            </>
          ) : (
            "We&apos;ve sent a verification link to your email address"
          )}
        </p>
        <p className="font-body text-xs text-neutral-400">
          Click the link in the email to verify your account
        </p>
      </div>

      {/* Resend section */}
      <div className="space-y-3">
        {resendSuccess && (
          <p className="text-sm text-success">Verification email sent again!</p>
        )}
        <p className="font-body text-sm text-neutral-500">
          Didn&apos;t receive it?
        </p>
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={handleResend}
          disabled={resending || cooldown > 0}
        >
          {resending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Sending...
            </>
          ) : cooldown > 0 ? (
            `Resend email (${cooldown}s)`
          ) : (
            "Resend email"
          )}
        </Button>
      </div>

      {/* Change email link */}
      <p className="font-body text-sm text-neutral-500">
        Wrong address?{" "}
        <Link
          href="/register"
          className="font-medium text-brand-accent hover:underline"
        >
          Change email address
        </Link>
      </p>

      {/* Trust note */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-neutral-400">
        <ShieldCheck className="size-3.5 shrink-0" />
        <span>Your email is safe with us</span>
      </div>
    </div>
  );
}
