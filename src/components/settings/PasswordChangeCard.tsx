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
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { Lock, Loader2, Info } from "lucide-react";

export function PasswordChangeCard({
  currentPassword,
  newPassword,
  confirmPassword,
  changingPassword,
  hasPassword,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  onReauthRequired,
}: Readonly<{
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  changingPassword: boolean;
  hasPassword: boolean;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onReauthRequired: () => void;
}>) {
  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (hasPassword) {
      // For users with an existing password, trigger reauth flow
      onReauthRequired();
    } else {
      // SSO-only users setting their first password — submit directly
      onSubmit(e);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="size-5 text-brand-primary" />
          {hasPassword ? "Change Password" : "Set Password"}
        </CardTitle>
        <CardDescription>
          {hasPassword
            ? "Update your password to keep your account secure."
            : "Set a password to enable email/password login alongside your social sign-in."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasPassword && (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-brand-primary/5 p-3 text-sm text-brand-primary ring-1 ring-brand-primary/20">
            <Info className="mt-0.5 size-4 shrink-0" />
            <p>
              Your account uses Google Sign-In. Set a password to enable
              email/password login as well.
            </p>
          </div>
        )}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {hasPassword && (
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => onCurrentPasswordChange(e.target.value)}
                placeholder="Enter current password"
                required
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => onNewPasswordChange(e.target.value)}
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
              onChange={(e) => onConfirmPasswordChange(e.target.value)}
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
            {hasPassword ? "Update Password" : "Set Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
