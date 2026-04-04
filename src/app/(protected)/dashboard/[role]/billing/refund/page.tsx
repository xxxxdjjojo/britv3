"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, RotateCcw, Loader2, CheckCircle2 } from "lucide-react";

const REFUND_REASONS = [
  "Service not as described",
  "Technical issues preventing use",
  "Accidentally subscribed to wrong plan",
  "No longer need the service",
  "Other",
];

export default function RefundRequestPage() {
  const params = useParams<{ role: string }>();
  const router = useRouter();
  const [selectedReason, setSelectedReason] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const basePath = `/dashboard/${params.role}/billing`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedReason) {
      toast.error("Please select a reason for your refund request");
      return;
    }

    setIsSubmitting(true);
    try {
      const reason = additionalDetails.trim()
        ? `${selectedReason}: ${additionalDetails.trim()}`
        : selectedReason;

      const res = await fetch("/api/billing/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = (await res.json()) as { id?: string; error?: string };

      if (!res.ok) throw new Error(data.error ?? "Failed to submit refund request");

      setIsSubmitted(true);
      toast.success("Refund request submitted. Our team will review it within 2 business days.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit refund request");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-light dark:bg-success/20">
            <CheckCircle2 className="text-success" size={36} />
          </div>
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground">
              Request submitted
            </h2>
            <p className="mt-2 font-body text-sm text-neutral-500">
              We&apos;ll review your request and respond within 2 business days.
            </p>
          </div>
          <Button variant="outline" asChild className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
            <Link href={basePath}>Back to billing</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={basePath}><ArrowLeft size={16} /></Link>
        </Button>
        <div>
          <h1 className="font-heading text-xl font-semibold text-foreground">
            Request a Refund
          </h1>
          <p className="font-body text-sm text-neutral-500">
            Refunds are available within 14 days of subscription start
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-warning-light p-4 ring-1 ring-warning/20 dark:bg-warning/10 dark:ring-warning/30">
        <p className="font-body text-sm text-warning dark:text-warning">
          <strong>14-day refund policy:</strong> Refund requests must be submitted within 14 days of your subscription starting. Refunds are processed within 5–10 business days.
        </p>
      </div>

      <div className="rounded-xl bg-card shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60">
        <div className="flex items-center gap-2 border-b border-neutral-100/60 p-6 dark:border-neutral-700/60">
          <RotateCcw size={16} className="text-neutral-400" />
          <span className="font-heading text-base font-semibold text-foreground">Refund Request Form</span>
        </div>
        <div className="p-6">
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
            <div className="space-y-2">
              <Label className="font-body text-sm font-medium text-foreground">Reason for refund *</Label>
              <div className="space-y-2">
                {REFUND_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors ring-1 ${
                      selectedReason === reason
                        ? "bg-brand-primary-lighter ring-brand-primary dark:bg-brand-primary/10"
                        : "bg-card ring-neutral-200/60 hover:bg-muted/30 dark:ring-neutral-700/60"
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="accent-brand-primary"
                    />
                    <span className="font-body text-sm text-foreground">{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="details" className="font-body text-sm font-medium text-foreground">
                Additional details (optional)
              </Label>
              <Textarea
                id="details"
                placeholder="Please provide any additional context that might help us process your request..."
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={isSubmitting || !selectedReason}
                className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-primary/90"
              >
                {isSubmitting ? (
                  <><Loader2 size={14} className="mr-2 animate-spin" />Submitting…</>
                ) : (
                  "Submit Refund Request"
                )}
              </Button>
              <Button type="button" variant="ghost" asChild className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                <Link href={basePath}>Cancel</Link>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
