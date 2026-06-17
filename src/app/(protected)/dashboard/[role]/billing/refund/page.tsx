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
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <CheckCircle2 className="text-green-500" size={36} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
              Request submitted
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              We&apos;ll review your request and respond within 2 business days.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href={basePath}>Back to billing</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={basePath}><ArrowLeft size={16} /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100" style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}>
            Request a Refund
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Refunds are available within 14 days of subscription start
          </p>
        </div>
      </div>

      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
        <CardContent className="py-4">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>14-day refund policy:</strong> Refund requests must be submitted within 14 days of your subscription starting. Refunds are processed within 5–10 business days.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <RotateCcw size={16} className="text-gray-400" />
            Refund Request Form
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Reason for refund *</Label>
              <div className="space-y-2">
                {REFUND_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                      selectedReason === reason
                        ? "border-brand-primary bg-brand-primary-lighter dark:border-emerald-700 dark:bg-brand-primary/10"
                        : "border-border hover:bg-surface dark:border-gray-700 dark:hover:bg-gray-800"
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="accent-[#1B4D3E]"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="details" className="text-sm font-medium">
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
                className="bg-brand-primary text-white hover:bg-brand-primary-light"
              >
                {isSubmitting ? (
                  <><Loader2 size={14} className="mr-2 animate-spin" />Submitting…</>
                ) : (
                  "Submit Refund Request"
                )}
              </Button>
              <Button type="button" variant="ghost" asChild>
                <Link href={basePath}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
