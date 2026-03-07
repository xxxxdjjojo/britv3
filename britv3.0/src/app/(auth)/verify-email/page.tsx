"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

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
    <div className="space-y-6 text-center">
      {/* Email Icon */}
      <div className="flex justify-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-brand-primary-lighter">
          <Mail className="size-10 text-brand-primary" />
        </div>
      </div>

      {/* Message */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-neutral-900">
          Check your email
        </h1>
        <p className="mt-2 font-body text-sm text-neutral-500">
          {email ? (
            <>
              We sent a verification link to{" "}
              <span className="font-medium text-neutral-700">{email}</span>
            </>
          ) : (
            "We sent a verification link to your email address"
          )}
        </p>
        <p className="mt-1 font-body text-xs text-neutral-400">
          Click the link in the email to verify your account
        </p>
      </div>

      {/* Resend */}
      <div className="space-y-3">
        {resendSuccess && (
          <p className="text-sm text-success">
            Verification email sent again!
          </p>
        )}
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

      {/* Back to Login */}
      <p className="font-body text-sm text-neutral-500">
        <Link
          href="/login"
          className="font-medium text-brand-accent hover:underline"
        >
          Back to login
        </Link>
      </p>
    </div>
  );
}
