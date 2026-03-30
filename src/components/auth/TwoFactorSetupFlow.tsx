"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Check,
  Copy,
  Download,
  Loader2,
  Smartphone,
  QrCode,
  Key,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { OTPInput } from "@/components/auth/OTPInput";
import { WizardStepper } from "@/components/auth/WizardStepper";
import { createClient } from "@/lib/supabase/client";

const STEPS = ["Download App", "Scan QR Code", "Save Backup Codes"];

async function generateBackupCodes(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<string[]> {
  const codes = Array.from({ length: 8 }, () =>
    Math.random().toString(36).substring(2, 10).toUpperCase(),
  );

  const hashedCodes = await Promise.all(
    codes.map(async (code) => {
      const encoder = new TextEncoder();
      const data = encoder.encode(code);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }),
  );

  await supabase
    .from("user_backup_codes")
    .upsert(
      hashedCodes.map((hash) => ({
        user_id: userId,
        code_hash: hash,
        used: false,
      })),
      { onConflict: "user_id,code_hash" },
    );

  return codes;
}

export function TwoFactorSetupFlow(
  props: Readonly<{
    onComplete: () => void;
    onSkip?: () => void;
  }>,
) {
  const [step, setStep] = useState(0);
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [savedConfirmed, setSavedConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [secretCopied, setSecretCopied] = useState(false);
  const [codesCopied, setCodesCopied] = useState(false);

  const runEnrollMFA = useCallback(async () => {
    setIsEnrolling(true);
    setEnrollError(null);
    try {
      const supabase = createClient();
      const { data, error: enrollErr } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        issuer: "Britestate",
      });
      if (enrollErr || !data) {
        setEnrollError(
          enrollErr?.message ??
            "Unable to set up 2FA. You may already have a factor enrolled.",
        );
        return;
      }
      setFactorId(data.id);
      if (data.totp) {
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
      }
    } catch {
      setEnrollError(
        "Unable to set up 2FA. You may already have a factor enrolled.",
      );
    } finally {
      setIsEnrolling(false);
    }
  }, []);

  useEffect(() => {
    void runEnrollMFA();
  }, [runEnrollMFA]);

  async function handleVerify() {
    if (otpCode.length !== 6) return;
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: challengeData, error: cErr } =
        await supabase.auth.mfa.challenge({ factorId });
      if (cErr || !challengeData) {
        setError(cErr?.message ?? "Failed to create challenge");
        return;
      }
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: otpCode,
      });
      if (vErr) {
        setError("Invalid code. Please try again.");
        return;
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const codes = await generateBackupCodes(supabase, user.id);
        setBackupCodes(codes);
      }
      setStep(2);
    } finally {
      setLoading(false);
    }
  }

  function handleCopyCodes() {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCodesCopied(true);
    setTimeout(() => setCodesCopied(false), 2000);
  }

  function handleCopySecret() {
    navigator.clipboard.writeText(secret);
    setSecretCopied(true);
    setTimeout(() => setSecretCopied(false), 2000);
  }

  function handleDownloadCodes() {
    const blob = new Blob([backupCodes.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "britestate-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <WizardStepper steps={STEPS} currentStep={step} />

      {/* Step 0: Download app */}
      {step === 0 && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-neutral-50 p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary">
                <Smartphone className="size-5 text-white" aria-hidden="true" />
              </div>
              <div>
                <p className="font-sans text-sm font-medium text-neutral-900">
                  Download an authenticator app
                </p>
                <p className="mt-0.5 font-sans text-xs text-neutral-500">
                  Use any TOTP-compatible app to generate verification codes.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { name: "Google Authenticator", store: "App Store / Google Play" },
              { name: "Authy", store: "App Store / Google Play" },
              { name: "Microsoft Authenticator", store: "App Store / Google Play" },
              { name: "1Password", store: "App Store / Google Play" },
            ].map((app) => (
              <div
                key={app.name}
                className="rounded-xl border border-neutral-200 bg-white p-3.5 text-center transition-colors hover:border-brand-primary/30 hover:bg-brand-primary/5"
              >
                <p className="font-sans text-sm font-semibold text-neutral-900">
                  {app.name}
                </p>
                <p className="mt-0.5 font-sans text-xs text-neutral-500">
                  {app.store}
                </p>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            {props.onSkip && (
              <Button
                variant="outline"
                onClick={props.onSkip}
                className="flex-1 border-neutral-200"
                aria-label="Skip two-factor authentication setup for now"
              >
                Skip for now
              </Button>
            )}
            <Button
              onClick={() => setStep(1)}
              className="flex-1 bg-brand-primary text-white hover:bg-brand-primary-light"
              aria-label="Proceed to scan QR code"
            >
              I have an app
            </Button>
          </div>
        </div>
      )}

      {/* Step 1: Scan QR */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="rounded-2xl bg-neutral-50 p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary">
                <QrCode className="size-5 text-white" aria-hidden="true" />
              </div>
              <div>
                <p className="font-sans text-sm font-medium text-neutral-900">
                  Scan with your authenticator app
                </p>
                <p className="mt-0.5 font-sans text-xs text-neutral-500">
                  Open your app and scan the QR code below to add Britestate.
                </p>
              </div>
            </div>
          </div>

          {/* QR code display */}
          <div className="flex justify-center">
            {isEnrolling ? (
              <div className="flex size-48 items-center justify-center rounded-2xl border border-neutral-200 bg-white">
                <Loader2
                  className="size-8 animate-spin text-neutral-400"
                  aria-label="Loading QR code"
                />
              </div>
            ) : !isEnrolling && enrollError ? (
              <div className="space-y-3 w-full">
                <Alert variant="destructive">
                  <AlertDescription>{enrollError}</AlertDescription>
                </Alert>
                <Button
                  variant="outline"
                  onClick={() => void runEnrollMFA()}
                  className="w-full"
                  aria-label="Retry 2FA enrollment"
                >
                  Retry
                </Button>
              </div>
            ) : qrCode ? (
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrCode}
                  alt="QR code for two-factor authentication setup — scan with your authenticator app"
                  className="size-44"
                />
              </div>
            ) : (
              <div className="flex size-48 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50 text-sm text-neutral-400">
                Loading QR&hellip;
              </div>
            )}
          </div>

          {/* Manual entry key */}
          {secret && !isEnrolling && !enrollError && (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Key className="size-4 shrink-0 text-neutral-400" aria-hidden="true" />
                  <span className="font-sans text-xs text-neutral-500">
                    Manual entry key:
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopySecret}
                  className="shrink-0 text-xs text-brand-accent hover:bg-brand-accent-light"
                  aria-label="Copy manual entry key to clipboard"
                >
                  {secretCopied ? (
                    <>
                      <Check className="size-3" aria-hidden="true" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-3" aria-hidden="true" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <p className="mt-2 break-all font-mono text-xs font-medium text-neutral-700">
                {secret}
              </p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!isEnrolling && !enrollError && (
            <div className="space-y-3">
              <p className="font-sans text-sm font-medium text-neutral-700">
                Enter the 6-digit code from your app:
              </p>
              <div className="flex justify-center">
                <OTPInput value={otpCode} onChange={setOtpCode} autoFocus />
              </div>
              <Button
                onClick={handleVerify}
                disabled={otpCode.length !== 6 || loading}
                className="w-full bg-brand-primary text-white hover:bg-brand-primary-light"
                size="lg"
                aria-label="Verify the 6-digit code to complete 2FA setup"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Verifying&hellip;
                  </>
                ) : (
                  "Verify & Continue"
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Backup codes */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="rounded-2xl bg-warning-light p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-warning/20">
                <Key className="size-5 text-warning" aria-hidden="true" />
              </div>
              <div>
                <p className="font-sans text-sm font-semibold text-neutral-900">
                  Save your backup codes
                </p>
                <p className="mt-0.5 font-sans text-xs text-neutral-600">
                  Store these in a safe place. Each code can only be used once
                  if you lose access to your authenticator app.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code) => (
                <span
                  key={code}
                  className="rounded-lg bg-white px-3 py-2 text-center font-mono text-sm font-semibold text-neutral-900 shadow-sm"
                >
                  {code}
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyCodes}
              className="flex-1 border-neutral-200 text-neutral-700"
              aria-label="Copy all backup codes to clipboard"
            >
              {codesCopied ? (
                <>
                  <Check className="size-3.5" aria-hidden="true" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="size-3.5" aria-hidden="true" />
                  Copy all
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadCodes}
              className="flex-1 border-neutral-200 text-neutral-700"
              aria-label="Download backup codes as a text file"
            >
              <Download className="size-3.5" aria-hidden="true" />
              Download
            </Button>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 transition-colors hover:border-brand-primary/30 hover:bg-brand-primary/5">
            <input
              type="checkbox"
              checked={savedConfirmed}
              onChange={(e) => setSavedConfirmed(e.target.checked)}
              className="size-4 accent-brand-primary"
              aria-label="Confirm you have saved your backup codes"
            />
            <span className="font-sans text-sm text-neutral-700">
              I&apos;ve saved these backup codes in a secure place
            </span>
          </label>

          <Button
            onClick={props.onComplete}
            disabled={!savedConfirmed}
            className="w-full bg-brand-primary text-white hover:bg-brand-primary-light disabled:opacity-50"
            size="lg"
            aria-label="Complete two-factor authentication setup"
          >
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Complete Setup
          </Button>
        </div>
      )}
    </div>
  );
}
