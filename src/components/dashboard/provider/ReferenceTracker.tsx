"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Clock,
  CheckCircle,
  Send,
  XCircle,
  Ban,
  AlertTriangle,
  RotateCcw,
  Eye,
} from "lucide-react";
import type {
  ProviderReference,
  ProviderReferenceStatus,
} from "@/types/provider-dashboard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type Props = Readonly<{
  references: ProviderReference[];
  referenceType: "client" | "peer";
  /** How many verified vouches are required for this reference type. */
  requiredCount: number;
  /** Client-vouch recency window in days (only used when referenceType==='client'). */
  recencyDays?: number;
}>;

type FormState = {
  referee_name: string;
  referee_email: string;
  relationship: string;
};

const EMPTY_FORM: FormState = {
  referee_name: "",
  referee_email: "",
  relationship: "",
};

/** Statuses from which the trader can resend or cancel an invitation. */
const ACTIONABLE_STATUSES: ProviderReferenceStatus[] = ["pending", "sent"];

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(2, local.length - 2))}@${domain}`;
}

type BadgeMeta = { label: string; className: string; Icon: typeof Clock };

const STATUS_BADGES: Record<ProviderReferenceStatus, BadgeMeta> = {
  pending: {
    label: "Awaiting send",
    className: "bg-[#FEF9C3] text-[#CA8A04]",
    Icon: Clock,
  },
  sent: {
    label: "Invitation sent",
    className: "bg-[#DBEAFE] text-[#1D4ED8]",
    Icon: Send,
  },
  submitted: {
    label: "Awaiting review",
    className: "bg-[#EDE9FE] text-[#6D28D9]",
    Icon: Eye,
  },
  verified: {
    label: "Verified",
    className: "bg-[#DCFCE7] text-[#16A34A]",
    Icon: CheckCircle,
  },
  declined: {
    label: "Declined",
    className: "bg-neutral-100 text-neutral-600",
    Icon: XCircle,
  },
  expired: {
    label: "Expired",
    className: "bg-neutral-100 text-neutral-600",
    Icon: Clock,
  },
  revoked: {
    label: "Cancelled",
    className: "bg-neutral-100 text-neutral-600",
    Icon: Ban,
  },
  rejected: {
    label: "Rejected",
    className: "bg-[#FEE2E2] text-[#DC2626]",
    Icon: XCircle,
  },
  flagged: {
    label: "Flagged",
    className: "bg-[#FEF3C7] text-[#B45309]",
    Icon: AlertTriangle,
  },
};

function StatusBadge({ status }: { status: ProviderReferenceStatus }) {
  // Unknown/未来 statuses must not mislabel — fall back to the raw value.
  const meta = STATUS_BADGES[status];
  if (!meta) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
        {status}
      </span>
    );
  }
  const { label, className, Icon } = meta;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      <Icon className="size-3" />
      {label}
    </span>
  );
}

export function ReferenceTracker({
  references,
  referenceType,
  requiredCount,
  recencyDays,
}: Props) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogRef, setViewDialogRef] = useState<ProviderReference | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Per-row action state (resend/cancel) keyed by reference id.
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);

  // Only fully-verified references count toward the requirement. 'submitted'
  // means awaiting admin review — it is NOT yet a completed vouch.
  const verifiedCount = references.filter((r) => r.status === "verified").length;

  const slotCount = Math.max(requiredCount, references.length);
  const slots = Array.from({ length: slotCount }, (_, i) => references[i] ?? null);

  async function handleAddReference() {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/provider/references", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referee_name: form.referee_name,
          referee_email: form.referee_email,
          reference_type: referenceType,
          relationship: form.relationship || undefined,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Could not send the request. Please try again.");
        return;
      }

      setForm(EMPTY_FORM);
      setDialogOpen(false);
      router.refresh();
    } catch {
      setError("Could not send the request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRowAction(ref: ProviderReference, action: "resend" | "cancel") {
    setRowError(null);
    setRowBusyId(ref.id);
    try {
      const res = await fetch(`/api/provider/references/${ref.id}/${action}`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setRowError({
          id: ref.id,
          message: data?.error ?? "Action failed. Please try again.",
        });
        return;
      }
      router.refresh();
    } catch {
      setRowError({ id: ref.id, message: "Action failed. Please try again." });
    } finally {
      setRowBusyId(null);
    }
  }

  const recencyNote =
    referenceType === "client"
      ? ` Client references must relate to work in the last ${recencyDays} days.`
      : "";

  return (
    <div className="space-y-6">
      {/* Progress indicator — verified only */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-600">
          <span className="font-semibold text-neutral-900">{verifiedCount}</span> /{" "}
          {requiredCount} verified
        </p>
        <div className="flex gap-1" aria-hidden="true">
          {Array.from({ length: requiredCount }, (_, i) => (
            <div
              key={i}
              className={`h-2 w-8 rounded-full ${
                i < verifiedCount ? "bg-[#16A34A]" : "bg-neutral-200"
              }`}
            />
          ))}
        </div>
      </div>

      {recencyNote && <p className="text-xs text-neutral-400">{recencyNote.trim()}</p>}

      {/* Reference cards / empty slots */}
      <div className="space-y-3">
        {slots.map((ref, i) =>
          ref ? (
            <div
              key={ref.id}
              className="flex items-start justify-between rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
            >
              <div className="space-y-1">
                <p className="text-sm font-semibold text-neutral-900">{ref.referee_name}</p>
                <p className="text-xs text-neutral-500">{maskEmail(ref.referee_email)}</p>
                <p className="text-xs text-neutral-400">
                  Requested{" "}
                  {new Date(ref.requested_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                {ref.status === "verified" && ref.verified_at && (
                  <p className="text-xs text-[#16A34A]">
                    Verified{" "}
                    {new Date(ref.verified_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                )}
                {rowError?.id === ref.id && (
                  <p className="text-xs text-red-600">{rowError.message}</p>
                )}
              </div>

              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={ref.status} />
                <div className="mt-1 flex gap-2">
                  {ACTIONABLE_STATUSES.includes(ref.status) && (
                    <>
                      <button
                        type="button"
                        aria-label={`Resend invitation to ${ref.referee_name}`}
                        disabled={rowBusyId === ref.id}
                        onClick={() => handleRowAction(ref, "resend")}
                        className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-surface disabled:opacity-50"
                      >
                        <RotateCcw className="size-3" />
                        Resend
                      </button>
                      <button
                        type="button"
                        aria-label={`Cancel invitation to ${ref.referee_name}`}
                        disabled={rowBusyId === ref.id}
                        onClick={() => handleRowAction(ref, "cancel")}
                        className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
                      >
                        <Ban className="size-3" />
                        Cancel
                      </button>
                    </>
                  )}
                  {ref.status === "submitted" && ref.reference_text && (
                    <button
                      type="button"
                      onClick={() => setViewDialogRef(ref)}
                      className="inline-flex items-center gap-1 rounded-md bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-neutral-800"
                    >
                      <Eye className="size-3" />
                      View
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <button
              key={`empty-${i}`}
              type="button"
              onClick={() => setDialogOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-200 bg-surface p-4 text-sm font-medium text-neutral-400 transition hover:border-neutral-300 hover:bg-neutral-100 hover:text-neutral-600"
            >
              <UserPlus className="size-4" />
              Request Reference
            </button>
          ),
        )}
      </div>

      {/* Add reference dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setForm(EMPTY_FORM);
            setError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Request {referenceType === "client" ? "Client" : "Peer"} Reference
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-xs text-neutral-500">
              We&apos;ll email a secure link inviting them to vouch for your work. It becomes a
              verified reference only after they respond and it passes review.
            </p>
            <div className="space-y-1.5">
              <label htmlFor="referee_name" className="text-sm font-medium text-neutral-900">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="referee_name"
                type="text"
                value={form.referee_name}
                onChange={(e) => setForm((f) => ({ ...f, referee_name: e.target.value }))}
                placeholder="Jane Smith"
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="referee_email" className="text-sm font-medium text-neutral-900">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="referee_email"
                type="email"
                value={form.referee_email}
                onChange={(e) => setForm((f) => ({ ...f, referee_email: e.target.value }))}
                placeholder="jane@example.com"
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="relationship" className="text-sm font-medium text-neutral-900">
                Relationship
              </label>
              <input
                id="relationship"
                type="text"
                value={form.relationship}
                onChange={(e) => setForm((f) => ({ ...f, relationship: e.target.value }))}
                placeholder={
                  referenceType === "client"
                    ? "e.g. Kitchen renovation client"
                    : "e.g. Fellow plumber"
                }
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
            )}
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={handleAddReference}
              disabled={submitting || !form.referee_name || !form.referee_email}
              className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {submitting ? "Sending…" : "Send Invitation"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View reference text dialog */}
      {viewDialogRef && (
        <Dialog open={!!viewDialogRef} onOpenChange={() => setViewDialogRef(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Reference from {viewDialogRef.referee_name}</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              {viewDialogRef.reference_text ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">
                  {viewDialogRef.reference_text}
                </p>
              ) : (
                <p className="text-sm italic text-neutral-400">
                  No reference text available yet.
                </p>
              )}
            </div>
            <DialogFooter showCloseButton />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
