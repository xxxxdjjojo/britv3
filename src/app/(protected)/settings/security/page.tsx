"use client";

import { useState, useEffect, useCallback } from "react";
import { updatePassword } from "@/services/auth/auth-service";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { PasswordChangeCard } from "@/components/settings/PasswordChangeCard";
import { TotpEnrollmentCard } from "@/components/settings/TotpEnrollmentCard";
import { ActiveSessionsList } from "@/components/settings/ActiveSessionsList";

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
        setMfaState("PENDING");
        setFactorId(totpFactor.id);
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
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkMfaStatus();
    void loadSessions();
  }, [checkMfaStatus, loadSessions]);

  // ---------------------------------------------------------------------------
  // Section 1: Change Password handlers
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
  // Section 2: MFA handlers
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
  // Section 3: Sessions handlers
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

      <PasswordChangeCard
        currentPassword={currentPassword}
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        changingPassword={changingPassword}
        onCurrentPasswordChange={setCurrentPassword}
        onNewPasswordChange={setNewPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onSubmit={handlePasswordChange}
      />

      <TotpEnrollmentCard
        mfaState={mfaState}
        mfaLoading={mfaLoading}
        totpData={totpData}
        totpCode={totpCode}
        verifying={verifying}
        enrolling={enrolling}
        disabling={disabling}
        backupCodes={backupCodes}
        regenerating={regenerating}
        copiedAll={copiedAll}
        onTotpCodeChange={setTotpCode}
        onStartEnroll={handleStartEnroll}
        onVerify={handleVerify}
        onDisable={handleDisable}
        onRegenerateBackupCodes={handleRegenerateBackupCodes}
        onCopyAll={handleCopyAll}
        onDownload={handleDownload}
        onDismissBackupCodes={() => setBackupCodes(null)}
      />

      <ActiveSessionsList
        sessions={sessions}
        sessionsLoading={sessionsLoading}
        signingOut={signingOut}
        signingOutSession={signingOutSession}
        onSignOutAll={handleSignOutAll}
        onSignOutSession={handleSignOutSession}
      />
    </div>
  );
}
