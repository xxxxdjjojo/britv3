"use client";

import { useState } from "react";
import { UserPlus, Clock, CheckCircle, Mail, Eye, Bell } from "lucide-react";
import type { ProviderReference } from "@/types/provider-dashboard";
import { createClient } from "@/lib/supabase/client";
import { sendReferenceRequest } from "@/services/provider/provider-verification-service";
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
  providerId: string;
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

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(2, local.length - 2))}@${domain}`;
}

function StatusBadge({ status }: { status: ProviderReference["status"] }) {
  if (status === "verified") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] px-2 py-0.5 text-xs font-medium text-[#16A34A]">
        <CheckCircle className="size-3" />
        Verified
      </span>
    );
  }
  if (status === "submitted") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#DBEAFE] px-2 py-0.5 text-xs font-medium text-[#1D4ED8]">
        <Eye className="size-3" />
        Submitted
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF9C3] px-2 py-0.5 text-xs font-medium text-[#CA8A04]">
      <Clock className="size-3" />
      Pending
    </span>
  );
}

export function ReferenceTracker({ references, referenceType, providerId }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogRef, setViewDialogRef] = useState<ProviderReference | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localRefs, setLocalRefs] = useState<ProviderReference[]>(references);
  const [resending, setResending] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);

  const activeRefs = localRefs.filter((r) => !r.cancelled_at);
  const submittedCount = activeRefs.filter(
    (r) => r.status === "submitted" || r.status === "verified",
  ).length;

  const slots = Array.from(
    { length: Math.max(3, activeRefs.length + 1, 5) },
    (_, i) => (i < activeRefs.length ? activeRefs[i] : null),
  ).slice(0, 5);

  async function handleAddReference() {
    setError(null);
    setSubmitting(true);
    try {
      const supabase = createClient();
      const result = await sendReferenceRequest(
        providerId,
        {
          referee_name: form.referee_name,
          referee_email: form.referee_email,
          reference_type: referenceType,
        },
        supabase,
      );
      if (!result.success) {
        setError(result.error);
        return;
      }
      // Optimistic local update
      const newRef: ProviderReference = {
        id: result.referenceRequestId,
        provider_id: providerId,
        reference_type: referenceType,
        referee_name: form.referee_name,
        referee_email: form.referee_email,
        referee_phone: null,
        relationship: form.relationship || null,
        status: "pending",
        reference_text: null,
        requested_at: new Date().toISOString(),
        submitted_at: null,
        verified_at: null,
        submission_token_hash: null,
        last_reminded_at: null,
        reminder_count: 0,
        cancelled_at: null,
      };
      setLocalRefs((prev) => [newRef, ...prev]);
      setForm(EMPTY_FORM);
      setDialogOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend(refId: string) {
    setResending(refId);
    setError(null);
    try {
      const res = await fetch(`/api/provider/references/${refId}/resend`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to resend");
      }
    } finally {
      setResending(null);
    }
  }

  async function handleCancel(refId: string) {
    setCancelling(refId);
    setError(null);
    try {
      const res = await fetch(`/api/provider/references/${refId}/cancel`, { method: "POST" });
      if (res.ok) {
        // Remove cancelled ref from local state
        setLocalRefs((prev) => prev.filter((r) => r.id !== refId));
      } else {
        const data = await res.json();
        setError(data.error || "Failed to cancel");
      }
    } finally {
      setCancelling(null);
      setCancelConfirmId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-600">
          <span className="font-semibold text-neutral-900">{submittedCount}</span> / 3 submitted
        </p>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-2 w-8 rounded-full ${
                i < submittedCount ? "bg-[#16A34A]" : "bg-neutral-200"
              }`}
            />
          ))}
        </div>
      </div>

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
              </div>

              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={ref.status} />
                <div className="flex gap-2 mt-1">
                  {ref.status === "pending" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleResend(ref.id)}
                        disabled={resending === ref.id}
                        className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                      >
                        <Mail className="size-3" />
                        {resending === ref.id ? "Sending\u2026" : "Resend"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCancelConfirmId(ref.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {ref.status === "submitted" && (
                    <>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                      >
                        <Bell className="size-3" />
                        Remind
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewDialogRef(ref)}
                        className="inline-flex items-center gap-1 rounded-md bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-neutral-800"
                      >
                        <Eye className="size-3" />
                        View
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <button
              key={`empty-${i}`}
              type="button"
              onClick={() => setDialogOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-4 text-sm font-medium text-neutral-400 transition hover:border-neutral-300 hover:bg-neutral-100 hover:text-neutral-600"
            >
              <UserPlus className="size-4" />
              Add Reference
            </button>
          ),
        )}
      </div>

      {/* Add reference dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add {referenceType === "client" ? "Client" : "Peer"} Reference</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
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
                placeholder={referenceType === "client" ? "e.g. Kitchen renovation client" : "e.g. Fellow plumber"}
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
              {submitting ? "Sending…" : "Send Request"}
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
                <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">
                  {viewDialogRef.reference_text}
                </p>
              ) : (
                <p className="text-sm text-neutral-400 italic">No reference text available yet.</p>
              )}
            </div>
            <DialogFooter showCloseButton />
          </DialogContent>
        </Dialog>
      )}

      {/* Cancel confirmation dialog */}
      {cancelConfirmId && (
        <Dialog open={!!cancelConfirmId} onOpenChange={() => setCancelConfirmId(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Cancel Reference Request?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-neutral-600">
              This will cancel the reference request. You can add a new referee afterwards.
            </p>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setCancelConfirmId(null)}
                className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Keep
              </button>
              <button
                type="button"
                onClick={() => handleCancel(cancelConfirmId)}
                disabled={cancelling === cancelConfirmId}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {cancelling === cancelConfirmId ? "Cancelling\u2026" : "Cancel Request"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
