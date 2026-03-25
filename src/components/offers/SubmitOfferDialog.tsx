"use client";

import { type FormEvent, type ReactNode, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitOffer } from "@/hooks/useOffers";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SubmitOfferDialogProps = Readonly<{
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}>;

type FormState = {
  listingId: string;
  agentId: string;
  amountGBP: string;
  conditions: string;
};

const INITIAL_FORM: FormState = {
  listingId: "",
  agentId: "",
  amountGBP: "",
  conditions: "",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SubmitOfferDialog({ children, open, onOpenChange }: SubmitOfferDialogProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [validationError, setValidationError] = useState<string | null>(null);
  const submitMutation = useSubmitOffer();

  function resetForm() {
    setForm(INITIAL_FORM);
    setValidationError(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      resetForm();
    }
    onOpenChange(next);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setValidationError(null);

    // Validate
    if (!form.listingId.trim()) {
      setValidationError("Listing ID is required.");
      return;
    }

    if (!form.agentId.trim()) {
      setValidationError("Agent ID is required.");
      return;
    }

    const amount = Number(form.amountGBP);
    if (!form.amountGBP || isNaN(amount) || amount <= 0) {
      setValidationError("Offer amount must be a positive number.");
      return;
    }

    if (amount < 100_000) {
      setValidationError("Offer amount seems too low. Minimum is usually above 100,000 GBP.");
      return;
    }

    if (amount > 2_000_000) {
      setValidationError("Offer amount seems unusually high. Please verify the amount.");
      return;
    }

    submitMutation.mutate(
      {
        listingId: form.listingId.trim(),
        agentId: form.agentId.trim(),
        amountGBP: amount,
      },
      {
        onSuccess: () => {
          toast.success("Offer submitted successfully.");
          resetForm();
          onOpenChange(false);
        },
        onError: (error) => {
          const code = (error as Error & { code?: string }).code;

          if (code === "DUPLICATE_OFFER") {
            toast.error("You already have an active offer on this property.");
          } else if (code === "AIP_REQUIRED") {
            toast.error(
              "An Agreement in Principle (AIP) document is required for offers above 250,000 GBP.",
            );
          } else {
            toast.error(error.message || "Failed to submit offer. Please try again.");
          }
        },
      },
    );
  }

  return (
    <>
      {children}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit New Offer</DialogTitle>
          <DialogDescription>
            Enter the details for your property offer. Amounts are in GBP.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="listingId">Listing ID</Label>
            <Input
              id="listingId"
              placeholder="e.g. abc123-def456"
              value={form.listingId}
              onChange={(e) => setForm((prev) => ({ ...prev, listingId: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agentId">Agent ID</Label>
            <Input
              id="agentId"
              placeholder="e.g. agent-789"
              value={form.agentId}
              onChange={(e) => setForm((prev) => ({ ...prev, agentId: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amountGBP">Offer Amount (GBP)</Label>
            <Input
              id="amountGBP"
              type="number"
              min={1}
              step={1}
              placeholder="e.g. 325000"
              value={form.amountGBP}
              onChange={(e) => setForm((prev) => ({ ...prev, amountGBP: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="conditions">Conditions (optional)</Label>
            <Textarea
              id="conditions"
              placeholder="e.g. Subject to survey, chain-free buyer..."
              rows={3}
              value={form.conditions}
              onChange={(e) => setForm((prev) => ({ ...prev, conditions: e.target.value }))}
            />
          </div>

          {validationError && (
            <p className="text-sm text-destructive">{validationError}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitMutation.isPending}>
              {submitMutation.isPending ? "Submitting..." : "Submit Offer"}
            </Button>
          </DialogFooter>
        </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
