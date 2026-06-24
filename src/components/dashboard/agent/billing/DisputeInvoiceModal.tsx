"use client";

/**
 * DisputeInvoiceModal — "Dispute this invoice" modal (Truedeed Phase 5,
 * clause 9.5 Properly Raised Disputes).
 *
 * Collects grounds (mandatory) and optional dated evidence files, then hands
 * the values to the parent via onSubmit. Renders the clause-9.5 status
 * (inside / outside the 10-business-day window) and the dunning consequence
 * of submitting late so agents are never surprised by the choice.
 *
 * Hand-rolled dialog shell to match RebuttalModal — happy-dom unit suite has
 * no precedent for Base UI's portal/focus-trap stack.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type DisputeSubmission = {
  grounds: string;
  files: File[];
};

type DisputeInvoiceTarget = {
  id: string;
  invoiceNumber: string;
  propertyAddress: string;
  /** ISO datetime; used to render the window status. */
  issuedAt: string;
  /** Pre-computed server-side: is `now` still within the clause 9.5 window? */
  windowOpen: boolean;
  /** ISO datetime: end of the 10-business-day clause 9.5 window. */
  windowEnd: string;
};

type Props = Readonly<{
  invoice: DisputeInvoiceTarget;
  open: boolean;
  onClose: () => void;
  onSubmit: (submission: DisputeSubmission) => void;
  isSubmitting?: boolean;
  serverError?: string | null;
}>;

const EN_GB_DATE = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "long",
  timeZone: "Europe/London",
});

function formatDate(iso: string): string {
  return EN_GB_DATE.format(new Date(iso));
}

export function DisputeInvoiceModal({
  invoice,
  open,
  onClose,
  onSubmit,
  isSubmitting = false,
  serverError = null,
}: Props) {
  const [grounds, setGrounds] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function handleSubmit() {
    if (grounds.trim().length === 0) {
      setError("Please describe the grounds for the dispute.");
      return;
    }
    setError(null);
    onSubmit({ grounds, files });
  }

  const shownError = error ?? serverError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/40"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dispute-modal-title"
        className="relative z-10 w-full max-w-lg space-y-4 rounded-xl bg-background p-6 shadow-lg ring-1 ring-foreground/10"
      >
        <div className="space-y-1">
          <h2 id="dispute-modal-title" className="text-lg font-semibold">
            Dispute invoice {invoice.invoiceNumber}
          </h2>
          <p className="text-sm text-muted-foreground">
            You have 10 business days from the invoice date to dispute under
            clause 9.5. A properly raised dispute pauses the dunning clock on
            this invoice only — your other invoices keep theirs.
          </p>
        </div>

        <dl className="space-y-1 rounded-lg bg-muted/50 p-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Property</dt>
            <dd className="text-right font-medium">
              {invoice.propertyAddress}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Issued</dt>
            <dd className="font-medium">{formatDate(invoice.issuedAt)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Window closes</dt>
            <dd className="font-medium">{formatDate(invoice.windowEnd)}</dd>
          </div>
        </dl>

        {!invoice.windowOpen && (
          <div
            role="alert"
            className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800"
          >
            The 10-business-day window for this invoice has passed. We will
            still review the dispute on the merits, but the dunning clock will
            <strong> not </strong>
            pause while we do — please don&apos;t assume it has.
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="dispute-grounds">Grounds for the dispute</Label>
          <Textarea
            id="dispute-grounds"
            rows={5}
            placeholder="Explain why this invoice should not stand. Be specific — playbook categories: source (D1), fall-through (D2), different applicant (D3), tail-agreement (D4), fee-level (D5)."
            value={grounds}
            onChange={(event) => setGrounds(event.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dispute-evidence-files">
            Evidence files (optional)
          </Label>
          <Input
            id="dispute-evidence-files"
            type="file"
            multiple
            disabled={isSubmitting}
            onChange={(event) =>
              setFiles(Array.from(event.target.files ?? []))
            }
          />
          <p className="text-xs text-muted-foreground">
            Anything that supports your grounds — portal lead emails, CRM
            export, your fall-through record, your buyer&apos;s identity (D3).
          </p>
        </div>

        {shownError && (
          <p role="alert" className="text-sm text-destructive">
            {shownError}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="button" disabled={isSubmitting} onClick={handleSubmit}>
            {isSubmitting ? "Submitting…" : "Submit dispute"}
          </Button>
        </div>
      </div>
    </div>
  );
}
