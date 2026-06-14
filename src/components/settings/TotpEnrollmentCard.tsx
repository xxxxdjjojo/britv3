"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Loader2,
  Copy,
  Download,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

type MfaState = "DISABLED" | "PENDING" | "ENABLED";

type TotpData = {
  qr_code: string;
  secret: string;
  uri: string;
};

export function TotpEnrollmentCard({
  mfaState,
  mfaLoading,
  totpData,
  totpCode,
  verifying,
  enrolling,
  disabling,
  backupCodes,
  regenerating,
  copiedAll,
  onTotpCodeChange,
  onStartEnroll,
  onVerify,
  onDisable,
  onRegenerateBackupCodes,
  onCopyAll,
  onDownload,
  onDismissBackupCodes,
}: Readonly<{
  mfaState: MfaState;
  mfaLoading: boolean;
  totpData: TotpData | null;
  totpCode: string;
  verifying: boolean;
  enrolling: boolean;
  disabling: boolean;
  backupCodes: string[] | null;
  regenerating: boolean;
  copiedAll: boolean;
  onTotpCodeChange: (value: string) => void;
  onStartEnroll: () => void;
  onVerify: () => void;
  onDisable: () => void;
  onRegenerateBackupCodes: () => void;
  onCopyAll: () => void;
  onDownload: () => void;
  onDismissBackupCodes: () => void;
}>) {
  return (
    <Card className="rounded-xl border border-border">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 font-heading text-base font-semibold text-brand-primary-dark">
            <Shield className="size-4 text-brand-primary" />
            Two-Factor Authentication
          </CardTitle>
          {!mfaLoading && (
            <Badge
              variant={mfaState === "ENABLED" ? "default" : "secondary"}
              className={
                mfaState === "ENABLED"
                  ? "bg-success/20 text-success border-0"
                  : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 border-0"
              }
            >
              {mfaState === "ENABLED"
                ? "Active"
                : mfaState === "PENDING"
                  ? "Setup in progress"
                  : "Not set up"}
            </Badge>
          )}
        </div>
        <CardDescription className="text-sm text-muted-foreground">
          Add an extra layer of security by requiring a verification code in
          addition to your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {mfaLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading 2FA status…
          </div>
        ) : mfaState === "DISABLED" ? (
          <Button onClick={onStartEnroll} disabled={enrolling} className="w-full sm:w-auto">
            {enrolling ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Shield className="size-4" />
            )}
            Set up Authenticator App
          </Button>
        ) : mfaState === "PENDING" ? (
          <div className="space-y-4">
            {/* Resume banner when page loads with an unverified factor */}
            {!totpData && (
              <div className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning-foreground">
                <AlertTriangle className="size-4 shrink-0 text-warning" />
                <span>
                  2FA setup is incomplete. Restart setup to get a fresh QR
                  code.
                </span>
              </div>
            )}

            {totpData && (
              <>
                <p className="text-sm text-muted-foreground">
                  Scan this QR code with your authenticator app (e.g. Google
                  Authenticator, Authy).
                </p>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="shrink-0 rounded-xl border border-border bg-white p-2 dark:bg-neutral-900">
                    <img
                      src={totpData.qr_code}
                      alt="QR code for authenticator app"
                      className="h-36 w-36 rounded-md"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Or enter this key manually:
                    </p>
                    <code className="block break-all rounded-lg border border-border bg-muted px-3 py-2 font-mono text-sm">
                      {totpData.secret}
                    </code>
                  </div>
                </div>
              </>
            )}

            {totpData && (
              <div className="space-y-1.5">
                <Label htmlFor="totp-code" className="text-sm font-medium">
                  Verification Code
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="totp-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      onTotpCodeChange(val);
                    }}
                    placeholder="6-digit code"
                    className="w-36 font-mono tracking-widest"
                    disabled={verifying}
                  />
                  <Button
                    onClick={onVerify}
                    disabled={totpCode.length !== 6 || verifying}
                  >
                    {verifying ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : null}
                    Verify
                  </Button>
                </div>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={onStartEnroll}
              disabled={enrolling}
            >
              {enrolling ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              Restart setup
            </Button>
          </div>
        ) : (
          /* ENABLED */
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-success/5 px-3 py-2 text-sm">
              <CheckCircle className="size-4 shrink-0 text-success" />
              <span className="font-medium text-success">Authenticator App — Active</span>
            </div>

            {/* Backup codes — shown once after verify or regenerate */}
            {backupCodes && (
              <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-warning-foreground">
                  <AlertTriangle className="size-4 shrink-0 text-warning" />
                  Download before closing — codes will not be shown again
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {backupCodes.map((code) => (
                    <code
                      key={code}
                      className="font-mono text-sm rounded-md border border-border bg-background px-2 py-1"
                    >
                      {code}
                    </code>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onCopyAll}
                  >
                    {copiedAll ? (
                      <CheckCircle className="size-4 text-success" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                    {copiedAll ? "Copied" : "Copy All"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDownload}
                  >
                    <Download className="size-4" />
                    Download
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDismissBackupCodes}
                    className="ml-auto"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onRegenerateBackupCodes}
                disabled={regenerating}
              >
                {regenerating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Regenerate Backup Codes
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={onDisable}
                disabled={disabling}
              >
                {disabling ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Disable 2FA
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
