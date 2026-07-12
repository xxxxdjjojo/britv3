"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = Readonly<{
  userId: string;
  /** Whether the vouch gate is enforced AND currently unmet. Drives the
   *  approve-anyway confirm. When false, approve behaves as the quick action. */
  gateEnabled: boolean;
  allMet: boolean;
}>;

export function ProviderDecisionControl({ userId, gateEnabled, allMet }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<"approved" | "rejected" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const gateBlocksApprove = gateEnabled && !allMet;

  async function submit(decision: "approved" | "rejected") {
    setPending(decision);
    setError(null);
    try {
      const res = await fetch("/api/admin/verifications/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          decision,
          notes: notes.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? "Something went wrong. Try again.");
        setPending(null);
        return;
      }
      setPending(null);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
      setPending(null);
    }
  }

  function handleApprove() {
    // Only prompt when the gate is on and requirements are unmet. When the gate
    // is off (default), approve immediately — behaviour unchanged.
    if (gateBlocksApprove) {
      const ok = window.confirm(
        "Vouch requirements are not met — approve anyway?",
      );
      if (!ok) return;
    }
    void submit("approved");
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-neutral-900">
        Provider verification decision
      </h3>
      <p className="mt-0.5 text-xs text-neutral-500">
        Sets the provider&apos;s verification status.
      </p>

      <label
        htmlFor="provider-decision-notes"
        className="mt-3 block text-xs font-medium text-neutral-700"
      >
        Decision notes (optional)
      </label>
      <textarea
        id="provider-decision-notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        placeholder="Decision notes (optional)…"
        className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
      />

      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={pending !== null}
          onClick={handleApprove}
          className="rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {pending === "approved" ? "Approving…" : "Approve"}
        </button>
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => void submit("rejected")}
          className="rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {pending === "rejected" ? "Rejecting…" : "Reject"}
        </button>
      </div>
    </div>
  );
}
