"use client";

import { useState, useEffect } from "react";
import { Check, Copy, Download } from "lucide-react";
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

  useEffect(() => {
    // Enroll on mount
    const supabase = createClient();
    supabase.auth.mfa.enroll({ factorType: "totp", issuer: "Britestate" }).then(({ data, error: enrollError }) => {
      if (enrollError || !data) return;
      setFactorId(data.id);
      if (data.totp) {
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
      }
    });
  }, []);

  async function handleVerify() {
    if (otpCode.length !== 6) return;
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      // Create challenge
      const { data: challengeData, error: cErr } = await supabase.auth.mfa.challenge({ factorId });
      if (cErr || !challengeData) {
        setError(cErr?.message ?? "Failed to create challenge");
        return;
      }
      // Verify
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: otpCode,
      });
      if (vErr) {
        setError("Invalid code. Please try again.");
        return;
      }
      // Generate backup codes
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
        <div className="space-y-4">
          <p className="font-body text-sm text-neutral-600">
            Download an authenticator app to generate verification codes.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: "Google Authenticator", store: "App Store / Google Play" },
              { name: "Authy", store: "App Store / Google Play" },
            ].map((app) => (
              <div
                key={app.name}
                className="rounded-lg border border-neutral-200 p-4 text-center"
              >
                <p className="font-medium text-neutral-900 text-sm">{app.name}</p>
                <p className="text-xs text-neutral-500 mt-1">{app.store}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            {props.onSkip && (
              <Button variant="outline" onClick={props.onSkip} className="flex-1">
                Skip for now
              </Button>
            )}
            <Button onClick={() => setStep(1)} className="flex-1">
              I have an app
            </Button>
          </div>
        </div>
      )}

      {/* Step 1: Scan QR */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="font-body text-sm text-neutral-600">
            Scan this QR code with your authenticator app.
          </p>
          {qrCode ? (
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCode} alt="QR code for 2FA setup" className="size-40 rounded" />
            </div>
          ) : (
            <div className="flex size-40 mx-auto items-center justify-center rounded bg-neutral-100 text-sm text-neutral-400">
              Loading QR…
            </div>
          )}
          {secret && (
            <p className="text-center font-mono text-xs text-neutral-500 break-all">
              Manual code: {secret}
            </p>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <p className="text-sm text-neutral-600">Enter the 6-digit code from your app:</p>
            <div className="flex justify-center">
              <OTPInput value={otpCode} onChange={setOtpCode} autoFocus />
            </div>
          </div>
          <Button
            onClick={handleVerify}
            disabled={otpCode.length !== 6 || loading}
            className="w-full"
          >
            {loading ? "Verifying…" : "Verify"}
          </Button>
        </div>
      )}

      {/* Step 2: Backup codes */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="font-body text-sm text-neutral-600">
            Save these backup codes somewhere safe. Each can only be used once.
          </p>
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-neutral-50 p-4">
            {backupCodes.map((code) => (
              <span key={code} className="font-mono text-sm font-medium text-neutral-900">
                {code}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyCodes} className="gap-1.5">
              <Copy className="size-3.5" />
              Copy all
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadCodes} className="gap-1.5">
              <Download className="size-3.5" />
              Download
            </Button>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={savedConfirmed}
              onChange={(e) => setSavedConfirmed(e.target.checked)}
              className="size-4 accent-brand-primary"
            />
            <span className="text-sm text-neutral-700">I&apos;ve saved these codes</span>
          </label>
          <Button
            onClick={props.onComplete}
            disabled={!savedConfirmed}
            className="w-full"
          >
            <Check className="size-4" />
            All done
          </Button>
        </div>
      )}
    </div>
  );
}
