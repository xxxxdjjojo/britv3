"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircleIcon, AlertCircleIcon } from "lucide-react";

const REPORT_REASONS = [
  "Incorrect information",
  "Property no longer available",
  "Suspected fraud",
  "Offensive content",
  "Other",
] as const;

type ReportReason = (typeof REPORT_REASONS)[number];

type Props = Readonly<{
  propertyId: string;
  isOpen: boolean;
  onClose: () => void;
}>;

type SubmitState = "idle" | "loading" | "success" | "error";

export function ReportListingModal({ propertyId, isOpen, onClose }: Props) {
  const [reason, setReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleClose = () => {
    // Reset state on close (with slight delay so animation completes)
    onClose();
    setTimeout(() => {
      setReason("");
      setDetails("");
      setSubmitState("idle");
      setErrorMessage("");
    }, 200);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!reason) return;

    setSubmitState("loading");
    setErrorMessage("");

    try {
      const response = await fetch(`/api/properties/${propertyId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          details: details.trim() || undefined,
        }),
      });

      if (response.status === 401) {
        setErrorMessage("You must be logged in to report a listing.");
        setSubmitState("error");
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { error?: string };
        setErrorMessage(data.error ?? "Something went wrong. Please try again.");
        setSubmitState("error");
        return;
      }

      setSubmitState("success");
    } catch {
      setErrorMessage("Network error. Please check your connection and try again.");
      setSubmitState("error");
    }
  };

  const isSubmitting = submitState === "loading";
  const detailsLength = details.length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-md" aria-label="Report listing">
        <DialogHeader>
          <DialogTitle>Report this listing</DialogTitle>
          <DialogDescription>
            Help us keep Britestate accurate and trustworthy.
          </DialogDescription>
        </DialogHeader>

        {submitState === "success" ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircleIcon className="size-10 text-success" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground">
              Thank you for your report. We&apos;ll review it within 24 hours.
            </p>
            <Button variant="outline" size="sm" onClick={handleClose}>
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            {/* Reason selector */}
            <fieldset className="mb-4">
              <legend className="mb-2 text-sm font-medium text-foreground">
                Reason for reporting{" "}
                <span className="text-destructive" aria-hidden="true">*</span>
              </legend>
              <RadioGroup
                value={reason}
                onValueChange={(val) => setReason(val as ReportReason)}
                aria-label="Report reason"
              >
                {REPORT_REASONS.map((r) => (
                  <div key={r} className="flex items-center gap-2">
                    <RadioGroupItem
                      value={r}
                      id={`reason-${r.replace(/\s+/g, "-").toLowerCase()}`}
                      disabled={isSubmitting}
                    />
                    <Label
                      htmlFor={`reason-${r.replace(/\s+/g, "-").toLowerCase()}`}
                      className="cursor-pointer font-normal"
                    >
                      {r}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </fieldset>

            {/* Optional details */}
            <div className="mb-4">
              <Label htmlFor="report-details" className="mb-1.5 block font-medium">
                Additional details{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Textarea
                id="report-details"
                placeholder="Provide any extra context that might help our team..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={500}
                rows={3}
                disabled={isSubmitting}
                aria-describedby="report-details-count"
              />
              <p
                id="report-details-count"
                className="mt-1 text-right text-xs text-muted-foreground"
                aria-live="polite"
              >
                {detailsLength}/500
              </p>
            </div>

            {/* Error state */}
            {submitState === "error" && errorMessage && (
              <div
                role="alert"
                className="mb-4 flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
              >
                <AlertCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {errorMessage}
              </div>
            )}

            <DialogFooter showCloseButton={false}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!reason || isSubmitting}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit report"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
