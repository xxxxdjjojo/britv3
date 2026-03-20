"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function DeletionPendingBanner() {
  const [deletionDate, setDeletionDate] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkDeletion() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("scheduled_deletion_at")
        .eq("id", user.id)
        .single();

      // Column may not exist yet if migration hasn't been applied — fail silently
      if (!error && profile?.scheduled_deletion_at) {
        setDeletionDate(profile.scheduled_deletion_at as string);
      }
    }
    checkDeletion();
  }, []);

  async function handleCancel() {
    setCancelling(true);
    setError(null);

    try {
      const res = await fetch("/api/gdpr/cancel-deletion", {
        method: "POST",
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Failed to cancel deletion. Please try again.");
        return;
      }

      setCancelled(true);
    } catch {
      setError("Failed to cancel deletion. Please try again.");
    } finally {
      setCancelling(false);
    }
  }

  if (!deletionDate || cancelled) {
    if (cancelled) {
      return (
        <Alert className="mb-4 border-green-200 bg-green-50">
          <CheckCircle className="size-4 text-green-600" />
          <AlertTitle className="text-green-800">
            Deletion cancelled
          </AlertTitle>
          <AlertDescription className="text-green-700">
            Your account is no longer scheduled for deletion.
          </AlertDescription>
        </Alert>
      );
    }
    return null;
  }

  const formattedDate = new Date(deletionDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Alert variant="destructive" className="mb-4 border-red-200 bg-red-50">
      <AlertTriangle className="size-4" />
      <AlertTitle>Account deletion scheduled</AlertTitle>
      <AlertDescription>
        Your account is scheduled for permanent deletion on{" "}
        <span className="font-medium">{formattedDate}</span>. If you want to
        keep your account, cancel the deletion now.
      </AlertDescription>
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
      <div className="mt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancel}
          disabled={cancelling}
          className="border-red-300 text-red-700 hover:bg-red-100"
        >
          {cancelling ? "Cancelling..." : "Cancel Deletion"}
        </Button>
      </div>
    </Alert>
  );
}
