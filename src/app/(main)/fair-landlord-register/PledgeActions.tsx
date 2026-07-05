"use client";

import { useState } from "react";

type Props = Readonly<{
  hasPledged: boolean;
}>;

export function PledgeActions({ hasPledged: initialHasPledged }: Props) {
  const [hasPledged, setHasPledged] = useState(initialHasPledged);
  const [displayName, setDisplayName] = useState("");
  const [area, setArea] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSign(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/landlords/fair-landlord-pledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, area }),
      });

      if (res.status === 409) {
        setErrorMsg("You already have an active pledge.");
        setStatus("error");
        return;
      }
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }

      setHasPledged(true);
      setStatus("done");
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  }

  async function handleRevoke() {
    if (!confirm("Are you sure you want to withdraw your pledge?")) return;
    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/landlords/fair-landlord-pledge", {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }

      setHasPledged(false);
      setStatus("idle");
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  }

  if (hasPledged) {
    return (
      <div className="rounded-xl border border-brand-primary bg-brand-primary-lighter/30 p-6">
        <p className="font-medium text-brand-primary">
          You have signed the Fair Landlord Charter.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Your pledge is pending review before it appears on the public register.
        </p>
        <button
          type="button"
          onClick={handleRevoke}
          disabled={status === "submitting"}
          className="mt-4 text-sm font-medium text-destructive underline-offset-4 hover:underline disabled:opacity-50"
        >
          {status === "submitting" ? "Withdrawing…" : "Withdraw my pledge"}
        </button>
        {errorMsg && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            {errorMsg}
          </p>
        )}
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="rounded-xl border border-brand-primary bg-brand-primary-lighter/30 p-6">
        <p className="font-medium text-brand-primary">
          Thank you — your pledge has been received.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          It will appear on the public register once reviewed (usually within 24 hours).
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSign} noValidate className="space-y-4">
      <div>
        <label htmlFor="displayName" className="mb-1.5 block text-sm font-medium text-foreground">
          Name to display on the register
        </label>
        <input
          id="displayName"
          type="text"
          required
          maxLength={120}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="e.g. J. Smith or Smith Lettings"
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        />
      </div>

      <div>
        <label htmlFor="area" className="mb-1.5 block text-sm font-medium text-foreground">
          Area (town, city, or region)
        </label>
        <input
          id="area"
          type="text"
          required
          maxLength={120}
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="e.g. Leeds"
          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        />
      </div>

      {errorMsg && (
        <p role="alert" className="text-sm text-destructive">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting" || !displayName.trim() || !area.trim()}
        className="inline-flex items-center rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {status === "submitting" ? "Signing…" : "Sign the charter"}
      </button>
    </form>
  );
}
