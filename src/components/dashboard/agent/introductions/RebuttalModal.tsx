"use client";

/**
 * RebuttalModal — "Dispute this introduction" modal (Truedeed Phase 1, §6).
 *
 * Collects a claimed prior-contact date (which must pre-date the recorded
 * introduction) and at least one dated evidence file, then hands the values
 * to the parent via onSubmit.
 *
 * Hand-rolled dialog shell (role="dialog") rather than the Base UI Dialog
 * primitive: the unit suite (happy-dom) has no precedent for the Base UI
 * portal/focus-trap stack, and this contract must be deterministic there.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/formatters";

export type RebuttalSubmission = {
  /** Claimed prior-contact date, yyyy-mm-dd. */
  evidenceDatedAt: string;
  files: File[];
};

type RebuttalIntroduction = {
  id: string;
  applicantName: string;
  listingAddress: string;
  occurredAt: string;
};

type Props = Readonly<{
  introduction: RebuttalIntroduction;
  open: boolean;
  onClose: () => void;
  onSubmit: (submission: RebuttalSubmission) => void;
  isSubmitting?: boolean;
  serverError?: string | null;
}>;

export function RebuttalModal({
  introduction,
  open,
  onClose,
  onSubmit,
  isSubmitting = false,
  serverError = null,
}: Props) {
  const [evidenceDatedAt, setEvidenceDatedAt] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const occurredDate = introduction.occurredAt.slice(0, 10);

  function handleSubmit() {
    if (files.length === 0) {
      setError("An evidence file is required.");
      return;
    }
    if (!evidenceDatedAt) {
      setError("The date of your prior contact is required.");
      return;
    }
    if (evidenceDatedAt >= occurredDate) {
      setError(
        "Your evidence date must be before the introduction was recorded.",
      );
      return;
    }
    setError(null);
    onSubmit({ evidenceDatedAt, files });
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
        aria-labelledby="rebuttal-modal-title"
        className="relative z-10 w-full max-w-md space-y-4 rounded-xl bg-background p-6 shadow-lg ring-1 ring-foreground/10"
      >
        <div className="space-y-1">
          <h2 id="rebuttal-modal-title" className="text-lg font-semibold">
            Dispute this introduction
          </h2>
          <p className="text-sm text-muted-foreground">
            You have 5 business days from notification to dispute an
            introduction. Upload dated evidence of your prior contact with
            this applicant.
          </p>
        </div>

        <dl className="space-y-1 rounded-lg bg-muted/50 p-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Applicant</dt>
            <dd className="font-medium">{introduction.applicantName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Listing</dt>
            <dd className="text-right font-medium">
              {introduction.listingAddress}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Recorded</dt>
            <dd className="font-medium">{formatDate(introduction.occurredAt)}</dd>
          </div>
        </dl>

        <div className="space-y-2">
          <Label htmlFor="rebuttal-evidence-date">
            Date of your prior contact
          </Label>
          <Input
            id="rebuttal-evidence-date"
            type="date"
            max={occurredDate}
            value={evidenceDatedAt}
            onChange={(event) => setEvidenceDatedAt(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rebuttal-evidence-files">Evidence files</Label>
          <Input
            id="rebuttal-evidence-files"
            type="file"
            multiple
            onChange={(event) =>
              setFiles(Array.from(event.target.files ?? []))
            }
          />
        </div>

        {shownError && (
          <p role="alert" className="text-sm text-destructive">
            {shownError}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
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
