"use client";

import { useState } from "react";

type StartIdCheckButtonProps = Readonly<{
  /** Action label, e.g. "Get started" / "Re-apply". */
  label: string;
}>;

/**
 * id_check step action: starts a hosted identity-verification session and
 * redirects the trader to it. Styled to match the stepper's Link actions.
 */
export function StartIdCheckButton({ label }: StartIdCheckButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/kyc/session", { method: "POST" });
      const data = (await res.json()) as { redirectUrl?: string; error?: string };
      if (!res.ok || !data.redirectUrl) {
        setError(data.error ?? "Verification is unavailable right now.");
        return;
      }
      window.location.assign(data.redirectUrl);
    } catch {
      setError("Verification is unavailable right now.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.08em] text-brand-primary transition-colors hover:text-brand-primary-dark disabled:opacity-50"
      >
        {isLoading ? "Starting…" : `${label} →`}
      </button>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
