"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { updatePassword } from "@/services/auth/auth-service";
import { createClient } from "@/lib/supabase/client";
import { Lock, Shield, Monitor, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SecuritySettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Security</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your password, two-factor authentication, and active sessions.
        </p>
      </div>

      {/* Section 1: Change Password */}
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
                placeholder="Enter new password"
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
                <p className="text-xs text-error">Passwords do not match</p>
              )}
            </div>
            <Button type="submit" disabled={changingPassword}>
              {changingPassword && <Loader2 className="size-4 animate-spin" />}
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Section 2: Two-Factor Authentication (placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-5 text-brand-primary" />
            Two-Factor Authentication
            <Badge variant="secondary">Coming Soon</Badge>
          </CardTitle>
          <CardDescription>
            Add an extra layer of security by requiring a verification code in addition to your password.
            Two-factor authentication protects your account even if your password is compromised.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" disabled>
            Enable 2FA
          </Button>
        </CardContent>
      </Card>

      {/* Section 3: Active Sessions */}
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
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <Monitor className="size-5 text-success" />
            <div className="flex-1">
              <p className="text-sm font-medium">Current Device</p>
              <p className="text-xs text-muted-foreground">You are currently signed in on this device</p>
            </div>
          </div>
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

      {/* Section 4: Login History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-5 text-brand-primary" />
            Login History
          </CardTitle>
          <CardDescription>
            Recent authentication events for your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Login history will be available once authentication events are recorded.
            Check back after signing in from different devices.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
