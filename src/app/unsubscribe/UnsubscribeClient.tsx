"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, MailX, RefreshCw } from "lucide-react";

type Props = Readonly<{
  token: string;
  status: "pending" | "expired";
}>;

export default function UnsubscribeClient({ token, status }: Props) {
  const [state, setState] = useState<
    "idle" | "loading" | "done" | "error" | "resent"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (status === "expired") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-warning-light flex items-center justify-center">
              <MailX className="h-8 w-8 text-warning" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold">Link Expired</h1>
          <p className="text-muted-foreground">
            This unsubscribe link has expired (links are valid for 7 days).
            Please sign in to manage your notification preferences directly.
          </p>
          <Button
            onClick={() => {
              setState("resent");
            }}
            disabled={state === "loading" || state === "resent"}
            variant="outline"
          >
            {state === "loading" && (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            )}
            {state === "resent" ? "Redirecting..." : "Manage preferences"}
          </Button>
          {state === "resent" && (
            <p className="text-sm text-muted-foreground">
              Please sign in to update your notification settings.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (state === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-success-light flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold">Unsubscribed</h1>
          <p className="text-muted-foreground">
            You&apos;ve been unsubscribed from Britestate email notifications.
            You can re-enable them at any time from your notification settings.
          </p>
          <Button variant="outline" asChild>
            <a href="/settings/notifications">Manage Preferences</a>
          </Button>
        </div>
      </div>
    );
  }

  async function handleUnsubscribe() {
    setState("loading");
    setErrorMsg(null);
    try {
      const res = await fetch(
        `/api/notifications/unsubscribe?token=${encodeURIComponent(token)}`,
        { method: "POST" },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? "Failed to unsubscribe");
      }
      setState("done");
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to unsubscribe",
      );
      setState("error");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md text-center space-y-4">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-neutral-100 flex items-center justify-center">
            <MailX className="h-8 w-8 text-neutral-600" />
          </div>
        </div>
        <h1 className="text-2xl font-semibold">Unsubscribe from emails?</h1>
        <p className="text-muted-foreground">
          You&apos;ll stop receiving all email notifications from Britestate.
          You can re-enable them in your account settings.
        </p>
        {state === "error" && (
          <p className="text-sm text-destructive">
            {errorMsg ?? "Something went wrong. Please try again."}
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <Button onClick={handleUnsubscribe} disabled={state === "loading"}>
            {state === "loading" && (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            )}
            Yes, unsubscribe me
          </Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
