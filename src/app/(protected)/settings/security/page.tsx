"use client";

import { useState, useEffect, useCallback } from "react";
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
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { updatePassword } from "@/services/auth/auth-service";
import { createClient } from "@/lib/supabase/client";
import {
  Lock,
  Shield,
  Monitor,
  Smartphone,
  Laptop,
  LogOut,
  Loader2,
  Copy,
  Download,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MfaState = "DISABLED" | "PENDING" | "ENABLED";

type TotpData = {
  qr_code: string;
  secret: string;
  uri: string;
};

type SessionInfo = {
  id: string;
  user_agent?: string;
  created_at?: string;
  last_sign_in_at?: string;
  ip?: string;
  is_current: boolean;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function deviceIcon(userAgent?: string) {
  if (!userAgent) return <Monitor className="size-5 text-muted-foreground" />;
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad/.test(ua)) {
    return <Smartphone className="size-5 text-muted-foreground" />;
  }
  if (/macintosh|windows|linux/.test(ua)) {
    return <Laptop className="size-5 text-muted-foreground" />;
  }
  return <Monitor className="size-5 text-muted-foreground" />;
}

function friendlyUserAgent(userAgent?: string): string {
  if (!userAgent) return "Unknown device";
  const ua = userAgent;
  if (/iPhone/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/Android/.test(ua)) return "Android device";
  if (/Macintosh/.test(ua)) return "Mac";
  if (/Windows/.test(ua)) return "Windows PC";
  if (/Linux/.test(ua)) return "Linux";
  return "Unknown device";
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "Unknown";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(dateStr));
  } catch {
    return "Unknown";
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SecuritySettingsPage() {
  // ---- Password state ----
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // ---- MFA state ----
  const [mfaState, setMfaState] = useState<MfaState>("DISABLED");
  const [mfaLoading, setMfaLoading] = useState(true);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [totpData, setTotpData] = useState<TotpData | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  // ---- Sessions state ----
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [signingOutSession, setSigningOutSession] = useState<string | null>(
    null,
  );

  // ---------------------------------------------------------------------------
  // On mount: check MFA status
  // ---------------------------------------------------------------------------

  const checkMfaStatus = useCallback(async () => {
    setMfaLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.mfa.listFactors();
      const totpFactor = data?.totp?.[0] ?? null;

      if (!totpFactor) {
        setMfaState("DISABLED");
        setFactorId(null);
        setTotpData(null);
      } else if (totpFactor.status === "unverified") {
        // Resume setup — keep factor_id so user can continue verifying
        setMfaState("PENDING");
        setFactorId(totpFactor.id);
        // No QR data from listFactors — user will need to restart enrollment to get fresh QR
        // We show a "resume" banner and a button to restart
        setTotpData(null);
      } else if (totpFactor.status === "verified") {
        setMfaState("ENABLED");
        setFactorId(totpFactor.id);
      }
    } catch {
      toast.error("Failed to load 2FA status");
    } finally {
      setMfaLoading(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // On mount: load sessions
  // ---------------------------------------------------------------------------

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const res = await fetch("/api/settings/sessions");
      if (!res.ok) {
        const { error } = (await res.json()) as { error?: string };
        throw new Error(error ?? "Failed to load sessions");
      }
      const { sessions: data } = (await res.json()) as {
        sessions: SessionInfo[];
      };
      setSessions(data ?? []);
    } catch (err) {
      console.error(err);
      // Silently degrade — session list is non-critical
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkMfaStatus();
    void loadSessions();
  }, [checkMfaStatus, loadSessions]);

  // ---------------------------------------------------------------------------
  // Section 1: Change Password
  // ---------------------------------------------------------------------------

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 12) {
      toast.error("Password must be at least 12 characters");
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await updatePassword(newPassword);
      if (error) {
        toast.error(error.message ?? "Failed to update password");
      } else {
        toast.success("Password updated successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } finally {
      setChangingPassword(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Section 2: MFA
  // ---------------------------------------------------------------------------

  async function handleStartEnroll() {
    setEnrolling(true);
    try {
      const res = await fetch("/api/settings/mfa/enroll", { method: "POST" });
      const body = (await res.json()) as {
        id?: string;
        totp?: TotpData;
        error?: string;
      };

      if (!res.ok) {
        toast.error(body.error ?? "Failed to start 2FA setup");
        return;
      }

      setFactorId(body.id ?? null);
      setTotpData(body.totp ?? null);
      setTotpCode("");
      setMfaState("PENDING");
    } catch {
      toast.error("Failed to start 2FA setup");
    } finally {
      setEnrolling(false);
    }
  }

  async function handleVerify() {
    if (!factorId || totpCode.length !== 6) return;
    setVerifying(true);
    try {
      const res = await fetch("/api/settings/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factor_id: factorId, code: totpCode }),
      });
      const body = (await res.json()) as {
        success?: boolean;
        backup_codes?: string[];
        error?: string;
      };

      if (!res.ok) {
        toast.error(body.error ?? "Verification failed");
        setTotpCode("");
        return;
      }

      setMfaState("ENABLED");
      setTotpData(null);
      setTotpCode("");
      if (body.backup_codes) {
        setBackupCodes(body.backup_codes);
      }
      toast.success("Two-factor authentication enabled");
    } catch {
      toast.error("Verification failed — please try again");
      setTotpCode("");
    } finally {
      setVerifying(false);
    }
  }

  async function handleDisable() {
    if (!factorId) return;
    setDisabling(true);
    try {
      const res = await fetch("/api/settings/mfa/unenroll", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factor_id: factorId }),
      });
      const body = (await res.json()) as { success?: boolean; error?: string };

      if (!res.ok) {
        toast.error(body.error ?? "Failed to disable 2FA");
        return;
      }

      setMfaState("DISABLED");
      setFactorId(null);
      setBackupCodes(null);
      toast.success("Two-factor authentication disabled");
    } catch {
      toast.error("Failed to disable 2FA");
    } finally {
      setDisabling(false);
    }
  }

  async function handleRegenerateBackupCodes() {
    setRegenerating(true);
    try {
      const res = await fetch("/api/settings/mfa/backup-codes", {
        method: "POST",
      });
      const body = (await res.json()) as {
        backup_codes?: string[];
        error?: string;
      };

      if (!res.ok) {
        toast.error(body.error ?? "Failed to regenerate backup codes");
        return;
      }

      setBackupCodes(body.backup_codes ?? null);
      toast.success("New backup codes generated");
    } catch {
      toast.error("Failed to regenerate backup codes");
    } finally {
      setRegenerating(false);
    }
  }

  function handleCopyAll() {
    if (!backupCodes) return;
    void navigator.clipboard.writeText(backupCodes.join("\n")).then(() => {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    });
  }

  function handleDownload() {
    if (!backupCodes) return;
    const content = [
      "Britestate — Backup Recovery Codes",
      "Keep these codes safe. Each code can only be used once.",
      "",
      ...backupCodes,
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "britestate-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  // ---------------------------------------------------------------------------
  // Section 3: Sessions
  // ---------------------------------------------------------------------------

  async function handleSignOutAll() {
    setSigningOut(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) {
        toast.error("Failed to sign out of all devices");
      } else {
        toast.success("Signed out of all devices");
        window.location.href = "/login";
      }
    } finally {
      setSigningOut(false);
    }
  }

  async function handleSignOutSession(sessionId: string) {
    setSigningOutSession(sessionId);
    try {
      const res = await fetch(`/api/settings/sessions?id=${sessionId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const { error } = (await res.json()) as { error?: string };
        toast.error(error ?? "Failed to sign out session");
        return;
      }
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast.success("Session signed out");
    } catch {
      toast.error("Failed to sign out session");
    } finally {
      setSigningOutSession(null);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Security</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your password, two-factor authentication, and active sessions.
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section 1: Change Password                                          */}
      {/* ------------------------------------------------------------------ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="size-5 text-brand-primary" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 12 characters"
                required
              />
              <PasswordStrengthMeter password={newPassword} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-destructive">
                  Passwords do not match
                </p>
              )}
            </div>
            <Button type="submit" disabled={changingPassword}>
              {changingPassword && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* Section 2: Two-Factor Authentication                                */}
      {/* ------------------------------------------------------------------ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-5 text-brand-primary" />
            Two-Factor Authentication
            {!mfaLoading && (
              <Badge
                variant={mfaState === "ENABLED" ? "default" : "secondary"}
                className={
                  mfaState === "ENABLED"
                    ? "bg-success/20 text-success"
                    : undefined
                }
              >
                {mfaState === "ENABLED"
                  ? "Active"
                  : mfaState === "PENDING"
                    ? "Setup in progress"
                    : "Not set up"}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
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
            <Button onClick={handleStartEnroll} disabled={enrolling}>
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
                <div className="flex items-center gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning-foreground">
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
                    <img
                      src={totpData.qr_code}
                      alt="QR code for authenticator app"
                      className="h-40 w-40 rounded-md border"
                    />
                    <div className="flex-1 space-y-1">
                      <p className="text-xs text-muted-foreground">
                        Or enter this key manually:
                      </p>
                      <code className="block break-all rounded-md bg-muted px-3 py-2 font-mono text-sm">
                        {totpData.secret}
                      </code>
                    </div>
                  </div>
                </>
              )}

              {totpData && (
                <div className="space-y-2">
                  <Label htmlFor="totp-code">Verification Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="totp-code"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={totpCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setTotpCode(val);
                      }}
                      placeholder="6-digit code"
                      className="w-36 font-mono tracking-widest"
                      disabled={verifying}
                    />
                    <Button
                      onClick={handleVerify}
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
                onClick={handleStartEnroll}
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
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="size-4 text-success" />
                <span className="font-medium">Authenticator App — Active</span>
              </div>

              {/* Backup codes — shown once after verify or regenerate */}
              {backupCodes && (
                <div className="rounded-md border border-warning/40 bg-warning/10 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-warning-foreground">
                    <AlertTriangle className="size-4 shrink-0 text-warning" />
                    Download before closing — codes will not be shown again
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {backupCodes.map((code) => (
                      <code
                        key={code}
                        className="font-mono text-sm rounded bg-background px-2 py-1"
                      >
                        {code}
                      </code>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyAll}
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
                      onClick={handleDownload}
                    >
                      <Download className="size-4" />
                      Download
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setBackupCodes(null)}
                      className="ml-auto"
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerateBackupCodes}
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
                  onClick={handleDisable}
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

      {/* ------------------------------------------------------------------ */}
      {/* Section 3: Active Sessions                                          */}
      {/* ------------------------------------------------------------------ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="size-5 text-brand-primary" />
            Active Sessions
          </CardTitle>
          <CardDescription>
            Manage your active sessions across all devices.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessionsLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading sessions…
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Monitor className="size-5 text-success" />
              <div className="flex-1">
                <p className="text-sm font-medium">Current Device</p>
                <p className="text-xs text-muted-foreground">
                  You are currently signed in on this device
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  {deviceIcon(session.user_agent)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {friendlyUserAgent(session.user_agent)}
                      </p>
                      {session.is_current && (
                        <Badge
                          variant="secondary"
                          className="bg-success/20 text-success text-xs"
                        >
                          Current session
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {session.last_sign_in_at
                        ? `Last active ${formatDate(session.last_sign_in_at)}`
                        : `Started ${formatDate(session.created_at)}`}
                    </p>
                  </div>
                  {!session.is_current && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSignOutSession(session.id)}
                      disabled={signingOutSession === session.id}
                    >
                      {signingOutSession === session.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <LogOut className="size-4" />
                      )}
                      <span className="sr-only">Sign out this session</span>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          <Button
            variant="destructive"
            size="sm"
            onClick={handleSignOutAll}
            disabled={signingOut}
          >
            {signingOut ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <LogOut className="size-4" />
            )}
            Sign Out of All Devices
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
