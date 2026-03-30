"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { OTPInput } from "@/components/auth/OTPInput";
import { createClient } from "@/lib/supabase/client";

const MAX_ATTEMPTS = 5;
const CODE_TTL_SECONDS = 30;

export function TwoFactorForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next") ?? searchParams.get("redirectTo");
  const next =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : "/dashboard";

  const [code, setCode] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(CODE_TTL_SECONDS);
  const [attempts, setAttempts] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get factorId from Supabase
  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data } = await supabase.auth.mfa.listFactors();
      const totp = data?.totp?.[0];
      if (!totp) return;
      setFactorId(totp.id);
      const { data: challenge, error: cErr } =
        await supabase.auth.mfa.challenge({ factorId: totp.id });
      if (!cErr && challenge) {
        setChallengeId(challenge.id);
      }
    }
    init();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  async function handleSubmit() {
    if (!factorId || !challengeId || code.length !== 6) return;
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code,
      });
      if (vErr) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        if (newAttempts >= MAX_ATTEMPTS) {
          router.push("/account-locked");
          return;
        }
        setError(
          `Invalid code. ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts === 1 ? "" : "s"} remaining.`,
        );
        setCode("");
        return;
      }
      router.push(next);
    } finally {
      setLoading(false);
    }
  }

  const attemptsRemaining = MAX_ATTEMPTS - attempts;
  const timerIsLow = timeLeft <= 10;

  return (
    <div className="space-y-6">
      {/* OTP inputs */}
      <div className="flex flex-col items-center gap-4">
        <OTPInput
          value={code}
          onChange={setCode}
          autoFocus
          disabled={loading}
        />

        {/* Code expiry timer */}
        <div
          className={
            timerIsLow
              ? "flex items-center gap-1.5 rounded-full bg-warning-light px-3 py-1 text-xs font-medium text-warning"
              : "flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-500"
          }
          aria-live="polite"
          aria-label={`Code expires in ${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`}
        >
          <Clock className="size-3.5 shrink-0" aria-hidden="true" />
          <span>
            Code expires in{" "}
            <span className="font-semibold tabular-nums">
              0:{String(timeLeft).padStart(2, "0")}
            </span>
          </span>
        </div>
      </div>

      {/* Attempt warning */}
      {attemptsRemaining <= 2 && attemptsRemaining > 0 && (
        <div
          className="rounded-xl bg-warning-light px-4 py-3 text-center"
          role="alert"
        >
          <p className="font-sans text-sm font-medium text-warning">
            {attemptsRemaining} attempt{attemptsRemaining === 1 ? "" : "s"}{" "}
            remaining before your account is locked
          </p>
        </div>
      )}

      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleSubmit}
        disabled={code.length !== 6 || loading || !challengeId}
        className="w-full bg-brand-primary text-white hover:bg-brand-primary-light disabled:opacity-50"
        size="lg"
        aria-label="Verify the 6-digit authentication code"
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Verifying&hellip;
          </>
        ) : (
          "Verify"
        )}
      </Button>

      <div className="space-y-2 text-center">
        <p className="font-sans text-sm text-neutral-500">
          <Link
            href="/two-factor?backup=true"
            className="font-medium text-brand-accent hover:underline"
            aria-label="Use a backup code instead of an authenticator code"
          >
            Use a backup code instead
          </Link>
        </p>
        <p className="font-sans text-xs text-neutral-400">
          Having trouble?{" "}
          <Link
            href="/help/2fa"
            className="text-neutral-500 hover:underline"
            aria-label="Get help with two-factor authentication"
          >
            Get help
          </Link>
        </p>
      </div>
    </div>
  );
}
