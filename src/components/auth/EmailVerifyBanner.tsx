"use client";

import { useState } from "react";
import { Mail, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function EmailVerifyBanner(
  props: Readonly<{
    email: string;
    emailConfirmed: boolean;
  }>,
) {
  const [dismissed, setDismissed] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  if (props.emailConfirmed || dismissed) {
    return null;
  }

  async function handleResend() {
    setResending(true);
    try {
      const supabase = createClient();
      await supabase.auth.resend({
        type: "signup",
        email: props.email,
      });
      setResent(true);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 bg-warning-light px-4 py-3">
      <div className="flex items-center gap-3">
        <Mail className="size-4 shrink-0 text-warning" />
        <p className="text-sm text-neutral-700">
          Please verify your email address.{" "}
          {resent ? (
            <span className="font-medium text-success">Verification email sent!</span>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              className="font-medium text-brand-accent hover:underline"
            >
              {resending ? (
                <Loader2 className="inline size-3 animate-spin" />
              ) : (
                "Resend verification email"
              )}
            </button>
          )}
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 text-neutral-400 hover:text-neutral-600"
        aria-label="Dismiss"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
