"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { OTPInput } from "@/components/auth/OTPInput";
import { createClient } from "@/lib/supabase/client";

const CODE_TTL_SECONDS = 30;

export function TwoFactorForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const isBackupMode = searchParams.get("backup") === "true";

  const [code, setCode] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(CODE_TTL_SECONDS);
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
    if (!factorId || !challengeId || (isBackupMode ? code.length < 8 : code.length !== 6)) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/mfa-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factorId, challengeId, code }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.locked) {
          router.push("/account-locked");
          return;
        }
        setError(
          data.remaining !== undefined
            ? `Invalid code. ${data.remaining} attempt${data.remaining === 1 ? "" : "s"} remaining.`
            : data.error ?? "Verification failed",
        );
        setCode("");
        return;
      }

      router.push(next);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {isBackupMode ? (
        <div className="space-y-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter backup code"
            className="h-12 text-center font-mono text-lg"
            maxLength={20}
            autoFocus
          />
        </div>
      ) : (
        <div className="flex justify-center">
          <OTPInput value={code} onChange={setCode} autoFocus />
        </div>
      )}

      {/* Countdown (only shown in TOTP mode) */}
      {!isBackupMode && (
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
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleSubmit}
        disabled={(isBackupMode ? code.length < 8 : code.length !== 6) || loading || !challengeId}
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
          href={isBackupMode ? `/two-factor?next=${encodeURIComponent(next)}` : `/two-factor?backup=true&next=${encodeURIComponent(next)}`}
          className="font-medium text-brand-accent hover:underline"
        >
          {isBackupMode ? "Use authenticator app instead" : "Use a backup code instead"}
        </Link>
      </p>
    </div>
  );
}
