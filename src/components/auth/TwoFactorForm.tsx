"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
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
  const next = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";

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
      const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId: totp.id });
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
      const { error: vErr } = await supabase.auth.mfa.verify({ factorId, challengeId, code });
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

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <OTPInput value={code} onChange={setCode} autoFocus />
      </div>

      {/* Countdown */}
      <p className="text-center font-body text-sm text-neutral-500">
        Code expires in{" "}
        <span
          className={
            timeLeft <= 10
              ? "font-medium text-warning"
              : "font-medium text-neutral-700"
          }
        >
          0:{String(timeLeft).padStart(2, "0")}
        </span>
      </p>

      {/* Attempt warning */}
      {attemptsRemaining <= 2 && attemptsRemaining > 0 && (
        <p className="text-center font-body text-sm font-medium text-warning">
          {attemptsRemaining} attempt{attemptsRemaining === 1 ? "" : "s"} remaining
        </p>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleSubmit}
        disabled={code.length !== 6 || loading || !challengeId}
        className="w-full"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Verifying…
          </>
        ) : (
          "Verify"
        )}
      </Button>

      <p className="text-center font-body text-sm text-neutral-500">
        <Link
          href="/two-factor?backup=true"
          className="font-medium text-brand-accent hover:underline"
        >
          Use a backup code instead
        </Link>
      </p>
    </div>
  );
}
