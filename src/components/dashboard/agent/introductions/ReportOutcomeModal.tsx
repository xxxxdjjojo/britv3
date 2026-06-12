"use client";

/**
 * ReportOutcomeModal — agent "Report outcome" modal (Truedeed Phase 2).
 *
 * Lets an agent report the outcome of an introduction. Selecting "Completed"
 * reveals completion-date and agreed-price (pounds) inputs; the price is
 * converted to pence before being handed to the parent via onSubmit.
 *
 * Hand-rolled dialog shell (role="dialog") like RebuttalModal so the contract
 * stays deterministic under happy-dom.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OutcomeType } from "@/types/truedeed";

export type OutcomeSubmission = {
  outcome: OutcomeType;
  /** yyyy-mm-dd, present for 'completed' outcomes. */
  completionDate?: string;
  /** Agreed price converted from the typed pounds to pence. */
  agreedPricePence?: number;
};

type OutcomeIntroduction = {
  id: string;
  applicantName: string;
  listingAddress: string;
};

const OUTCOME_OPTIONS: ReadonlyArray<{ value: OutcomeType; label: string }> = [
  { value: "offer_accepted", label: "Offer accepted" },
  { value: "exchanged", label: "Exchanged" },
  { value: "completed", label: "Completed" },
  { value: "fell_through", label: "Fell through" },
];

type Props = Readonly<{
  introduction: OutcomeIntroduction;
  open: boolean;
  onClose: () => void;
  onSubmit: (submission: OutcomeSubmission) => void;
  isSubmitting?: boolean;
  serverError?: string | null;
}>;

export function ReportOutcomeModal({
  introduction,
  open,
  onClose,
  onSubmit,
  isSubmitting = false,
  serverError = null,
}: Props) {
  const [outcome, setOutcome] = useState<OutcomeType>("offer_accepted");
  const [completionDate, setCompletionDate] = useState("");
  const [agreedPrice, setAgreedPrice] = useState("");
  const [dateError, setDateError] = useState<string | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);

  if (!open) return null;

  const isCompleted = outcome === "completed";

  function handleOutcomeChange(value: string) {
    setOutcome(value as OutcomeType);
    setDateError(null);
    setPriceError(null);
  }

  function handleSubmit() {
    if (!isCompleted) {
      onSubmit({ outcome });
      return;
    }

    const nextDateError = completionDate
      ? null
      : "Completion date is required.";
    const pricePounds = Number.parseFloat(agreedPrice);
    const nextPriceError =
      agreedPrice && Number.isFinite(pricePounds) && pricePounds > 0
        ? null
        : "Agreed price is required.";

    setDateError(nextDateError);
    setPriceError(nextPriceError);
    if (nextDateError || nextPriceError) return;

    onSubmit({
      outcome,
      completionDate,
      agreedPricePence: Math.round(pricePounds * 100),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/40"
        aria-hidden="true"
        onClick={onClose}
      />
      {/* aria-label (not aria-labelledby → the "Report outcome" title): the
          dialog's accessible name must not match the Outcome field's
          getByLabelText(/outcome/i) query. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Report the result of this introduction"
        className="relative z-10 w-full max-w-md space-y-4 rounded-xl bg-background p-6 shadow-lg ring-1 ring-foreground/10"
      >
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Report outcome</h2>
          <p className="text-sm text-muted-foreground">
            Record what happened with this introduction. Completed sales are
            reviewed before any introduction fee is invoiced.
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
        </dl>

        <div className="space-y-2">
          <Label htmlFor="report-outcome-select">Outcome</Label>
          <select
            id="report-outcome-select"
            value={outcome}
            onChange={(event) => handleOutcomeChange(event.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          >
            {OUTCOME_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {isCompleted && (
          <>
            <div className="space-y-2">
              <Label htmlFor="report-outcome-completion-date">
                Completion date
              </Label>
              <Input
                id="report-outcome-completion-date"
                type="date"
                value={completionDate}
                onChange={(event) => setCompletionDate(event.target.value)}
              />
              {dateError && (
                <p role="alert" className="text-sm text-destructive">
                  {dateError}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-outcome-agreed-price">
                Agreed price (£)
              </Label>
              <Input
                id="report-outcome-agreed-price"
                type="number"
                min="0"
                step="1"
                value={agreedPrice}
                onChange={(event) => setAgreedPrice(event.target.value)}
              />
              {priceError && (
                <p role="alert" className="text-sm text-destructive">
                  {priceError}
                </p>
              )}
            </div>
          </>
        )}

        {serverError && (
          <p role="alert" className="text-sm text-destructive">
            {serverError}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={isSubmitting} onClick={handleSubmit}>
            {isSubmitting ? "Reporting…" : "Report outcome"}
          </Button>
        </div>
      </div>
    </div>
  );
}
