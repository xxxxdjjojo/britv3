"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const FLAG_REASONS = [
  { value: "spam", label: "Spam", description: "Promotional or irrelevant content" },
  { value: "fake", label: "Fake review", description: "Not a genuine customer experience" },
  { value: "inappropriate", label: "Inappropriate", description: "Offensive or abusive language" },
  { value: "off_topic", label: "Off-topic", description: "Not related to the service received" },
  { value: "contact_info", label: "Contains personal info", description: "Phone numbers, emails, or addresses" },
  { value: "promotional", label: "Promotional", description: "Advertising a product or service" },
  { value: "duplicate", label: "Duplicate", description: "Same review posted multiple times" },
] as const;

type ReportReviewModalProps = Readonly<{
  reviewId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}>;

export function ReportReviewModal({
  reviewId,
  open,
  onOpenChange,
  onSuccess,
}: ReportReviewModalProps) {
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!reason) {
      toast.error("Please select a reason");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/reviews/${reviewId}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, description: description || undefined }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error ?? "Failed to report review");
      }

      toast.success("Report submitted. Our team will review it.");
      onOpenChange(false);
      setReason("");
      setDescription("");
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to report review");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-500" />
            Report Review
          </DialogTitle>
          <DialogDescription>
            Help us maintain trust by reporting reviews that violate our guidelines.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Reason *</Label>
            <div className="space-y-2">
              {FLAG_REASONS.map((item) => (
                <label
                  key={item.value}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                    reason === item.value
                      ? "border-brand-primary bg-brand-primary/5"
                      : "border-border hover:bg-muted/50",
                  )}
                >
                  <input
                    type="radio"
                    name="flag-reason"
                    value={item.value}
                    checked={reason === item.value}
                    onChange={(e) => setReason(e.target.value)}
                    className="mt-0.5 accent-brand-primary"
                  />
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="flag-description" className="text-sm">
              Additional details (optional)
            </Label>
            <Textarea
              id="flag-description"
              placeholder="Provide any additional context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-right text-xs text-muted-foreground">
              {description.length}/500
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason || isSubmitting}
            variant="destructive"
            className="flex-1"
          >
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
