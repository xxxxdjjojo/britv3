"use client";

/**
 * "Set up Direct Debit" — POSTs to the mandate-setup route and redirects the
 * director to the GoCardless hosted authorisation page (billing spec §1).
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function MandateSetupButton() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setIsPending(true);
    setError(null);
    try {
      const res = await fetch("/api/truedeed/billing/mandate-setup", {
        method: "POST",
      });
      const body = (await res.json()) as {
        authorisationUrl?: string;
        error?: string;
      };
      if (!res.ok || !body.authorisationUrl) {
        setError(body.error ?? "Failed to start Direct Debit setup.");
        setIsPending(false);
        return;
      }
      window.location.assign(body.authorisationUrl);
    } catch {
      setError("Failed to start Direct Debit setup. Please try again.");
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleClick} disabled={isPending}>
        {isPending ? "Redirecting…" : "Set up Direct Debit"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
