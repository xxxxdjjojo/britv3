"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export function ReauthDialog({
  open,
  onOpenChange,
  onSuccess,
  title = "Confirm your identity",
  description = "Enter your current password to continue.",
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (token: string) => void;
  title?: string;
  description?: string;
}>) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setPassword("");
    }
    onOpenChange(nextOpen);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/settings/reauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data: unknown = await res.json();

      if (!res.ok) {
        const message =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Re-authentication failed. Please try again.";
        toast.error(message);
        return;
      }

      const reauth_token =
        typeof data === "object" &&
        data !== null &&
        "reauth_token" in data &&
        typeof (data as { reauth_token: unknown }).reauth_token === "string"
          ? (data as { reauth_token: string }).reauth_token
          : null;

      if (!reauth_token) {
        toast.error("Unexpected response from server. Please try again.");
        return;
      }

      onSuccess(reauth_token);
      setPassword("");
      onOpenChange(false);
    } catch {
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-brand-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reauth-password">Password</Label>
            <Input
              id="reauth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || password.length === 0}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
