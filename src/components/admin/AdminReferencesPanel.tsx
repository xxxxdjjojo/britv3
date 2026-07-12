"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminReferenceView } from "@/services/admin/verification-service";
import type { ProviderReferenceStatus } from "@/types/provider-dashboard";

type Props = Readonly<{
  references: AdminReferenceView[];
}>;

// Statuses eligible for an admin decision. Only these rows expose action buttons.
const REVIEWABLE: ReadonlySet<ProviderReferenceStatus> = new Set([
  "submitted",
  "flagged",
]);

const STATUS_STYLES: Record<ProviderReferenceStatus, string> = {
  pending: "bg-neutral-100 text-neutral-600",
  sent: "bg-blue-50 text-blue-700",
  submitted: "bg-amber-50 text-amber-700",
  verified: "bg-green-50 text-green-700",
  declined: "bg-neutral-100 text-neutral-600",
  expired: "bg-neutral-100 text-neutral-500",
  revoked: "bg-neutral-100 text-neutral-500",
  rejected: "bg-red-50 text-red-700",
  flagged: "bg-orange-50 text-orange-700",
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB");
}

type Decision = "verify" | "reject" | "flag";

function ReferenceRow({ reference }: { reference: AdminReferenceView }) {
  const router = useRouter();
  const [pending, setPending] = useState<Decision | null>(null);
  const [error, setError] = useState<string | null>(null);
  // A dialog is open for reject/flag (reason required) or verify (reason optional).
  const [dialog, setDialog] = useState<Decision | null>(null);
  const [reason, setReason] = useState("");

  const isReviewable = REVIEWABLE.has(reference.status);
  const reasonRequired = dialog === "reject" || dialog === "flag";

  async function submit(decision: Decision, reasonText: string) {
    setPending(decision);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/references/${reference.id}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            decision,
            reason: reasonText.trim() || undefined,
          }),
        },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        if (res.status === 409) {
          setError(
            data?.error ?? "This reference was already reviewed. Refresh to see its current state.",
          );
        } else if (res.status === 400) {
          setError(data?.error ?? "A reason is required.");
        } else {
          setError(data?.error ?? "Something went wrong. Try again.");
        }
        setPending(null);
        return;
      }
      setDialog(null);
      setReason("");
      setPending(null);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
      setPending(null);
    }
  }

  function handleAction(decision: Decision) {
    // Always confirm via the dialog so an accidental click can't fire a decision.
    setError(null);
    setReason("");
    setDialog(decision);
  }

  function handleDialogConfirm() {
    if (!dialog) return;
    if ((dialog === "reject" || dialog === "flag") && !reason.trim()) {
      setError("A reason is required to reject or flag.");
      return;
    }
    void submit(dialog, reason);
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-neutral-900">
              {reference.referee_name}
            </h4>
            <span
              className={`rounded px-2 py-0.5 text-[11px] font-medium capitalize ${STATUS_STYLES[reference.status]}`}
            >
              {reference.status}
            </span>
            <span className="rounded bg-neutral-100 px-2 py-0.5 text-[11px] font-medium capitalize text-neutral-600">
              {reference.reference_type}
            </span>
          </div>
          {/* Admins are the reviewers and see the FULL referee email — it is the
              primary signal for duplicate / fraud / collusion detection across
              references. No masking here by design. */}
          <p className="mt-0.5 text-sm text-neutral-500">
            {reference.referee_email}
          </p>
          {reference.relationship && (
            <p className="mt-0.5 text-xs text-neutral-400">
              Relationship: {reference.relationship}
            </p>
          )}
        </div>
        <div className="text-right text-xs text-neutral-400">
          <p>Requested {formatDate(reference.requested_at)}</p>
          {reference.submitted_at && (
            <p>Submitted {formatDate(reference.submitted_at)}</p>
          )}
        </div>
      </div>

      {reference.reference_type === "client" && (
        <div className="mt-2 flex gap-4 text-xs text-neutral-500">
          <span>Work date: {formatDate(reference.work_date)}</span>
          {reference.rating !== null && (
            <span>Rating: {reference.rating}/5</span>
          )}
        </div>
      )}

      {reference.reference_text && (
        <blockquote className="mt-3 rounded border-l-2 border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
          {reference.reference_text}
        </blockquote>
      )}

      {reference.declined_reason && (
        <p className="mt-2 text-xs text-neutral-500">
          Declined reason: {reference.declined_reason}
        </p>
      )}

      {reference.reviewed_at && (
        <p className="mt-2 text-xs text-neutral-400">
          Reviewed {formatDate(reference.reviewed_at)}
          {reference.review_reason ? ` — ${reference.review_reason}` : ""}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}

      {isReviewable && !dialog && (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={pending !== null}
            onClick={() => handleAction("verify")}
            aria-label={`Verify reference from ${reference.referee_name}`}
            className="rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            Verify
          </button>
          <button
            type="button"
            disabled={pending !== null}
            onClick={() => handleAction("reject")}
            aria-label={`Reject reference from ${reference.referee_name}`}
            className="rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            Reject
          </button>
          <button
            type="button"
            disabled={pending !== null}
            onClick={() => handleAction("flag")}
            aria-label={`Flag reference from ${reference.referee_name}`}
            className="rounded bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-50"
          >
            Flag
          </button>
        </div>
      )}

      {isReviewable && dialog && (
        <div className="mt-3 space-y-2 rounded border border-neutral-200 bg-neutral-50 p-3">
          <label className="block text-xs font-medium text-neutral-700">
            {dialog === "verify"
              ? "Reason (optional)"
              : `Reason (required to ${dialog})`}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Enter a reason…"
            className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending !== null || (reasonRequired && !reason.trim())}
              onClick={handleDialogConfirm}
              className="rounded bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
            >
              {pending ? "Submitting…" : `Confirm ${dialog}`}
            </button>
            <button
              type="button"
              disabled={pending !== null}
              onClick={() => {
                setDialog(null);
                setReason("");
                setError(null);
              }}
              className="rounded border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminReferencesPanel({ references }: Props) {
  if (references.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-neutral-500">
        No references requested for this provider yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {references.map((reference) => (
        <ReferenceRow key={reference.id} reference={reference} />
      ))}
    </div>
  );
}
