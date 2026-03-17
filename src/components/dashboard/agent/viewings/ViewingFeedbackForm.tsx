"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Star, MessageSquare } from "lucide-react";
import type { AgentViewingFeedback, PriceOpinion, LikelihoodToOffer } from "@/types/agent";

// ── Stars rating ─────────────────────────────────────────────────────────────

function StarRating({
  value,
  onChange,
  readOnly = false,
}: Readonly<{ value: number; onChange?: (v: number) => void; readOnly?: boolean }>) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <button
          key={i}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(i + 1)}
          className={`size-5 transition-colors disabled:cursor-default ${
            i < value ? "text-amber-400" : "text-neutral-300"
          }`}
        >
          <Star
            className="size-5"
            fill={i < value ? "currentColor" : "none"}
          />
        </button>
      ))}
    </div>
  );
}

// ── Price opinion badge colour ────────────────────────────────────────────────

function priceOpinionVariant(opinion: PriceOpinion) {
  if (opinion === "too_high") return "bg-red-100 text-red-700";
  if (opinion === "about_right") return "bg-amber-100 text-amber-700";
  return "bg-green-100 text-green-700";
}

function priceOpinionLabel(opinion: PriceOpinion) {
  if (opinion === "too_high") return "Too high";
  if (opinion === "about_right") return "About right";
  return "Good value";
}

function likelihoodLabel(likelihood: LikelihoodToOffer) {
  if (likelihood === "unlikely") return "Unlikely";
  if (likelihood === "possible") return "Possible";
  if (likelihood === "likely") return "Likely";
  return "Very likely";
}

function likelihoodVariant(likelihood: LikelihoodToOffer) {
  if (likelihood === "unlikely") return "bg-red-50 text-red-600";
  if (likelihood === "possible") return "bg-amber-50 text-amber-600";
  if (likelihood === "likely") return "bg-blue-50 text-blue-600";
  return "bg-green-50 text-green-700";
}

// ── Feedback card ─────────────────────────────────────────────────────────────

function FeedbackCard({
  feedback,
}: Readonly<{ feedback: AgentViewingFeedback }>) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-medium">{feedback.buyer_name}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(feedback.created_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${priceOpinionVariant(feedback.price_opinion)}`}
            >
              {priceOpinionLabel(feedback.price_opinion)}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${likelihoodVariant(feedback.likelihood_to_offer)}`}
            >
              {likelihoodLabel(feedback.likelihood_to_offer)}
            </span>
          </div>
        </div>

        <div className="mt-3">
          <StarRating value={feedback.interest_level} readOnly />
        </div>

        {feedback.comments && (
          <p className="mt-2 text-sm text-neutral-700">{feedback.comments}</p>
        )}

        {feedback.viewing_slot_id && (
          <p className="mt-2 text-xs text-muted-foreground">
            Slot: {feedback.viewing_slot_id.slice(0, 8)}…
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Add feedback form ─────────────────────────────────────────────────────────

type FormState = {
  buyer_name: string;
  interest_level: number;
  price_opinion: PriceOpinion;
  likelihood_to_offer: LikelihoodToOffer;
  comments: string;
  viewing_slot_id: string;
};

const EMPTY_FORM: FormState = {
  buyer_name: "",
  interest_level: 3,
  price_opinion: "about_right",
  likelihood_to_offer: "possible",
  comments: "",
  viewing_slot_id: "",
};

function AddFeedbackForm({ onAdded }: Readonly<{ onAdded: () => void }>) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.buyer_name) {
      toast.error("Buyer name is required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/agent/viewings/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Failed to submit feedback");
      }

      toast.success("Feedback submitted");
      setForm(EMPTY_FORM);
      onAdded();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to submit feedback",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add Viewing Feedback</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="buyer_name">Buyer name *</Label>
              <Input
                id="buyer_name"
                value={form.buyer_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, buyer_name: e.target.value }))
                }
                placeholder="e.g. John Smith"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="viewing_slot_id">Viewing slot ID (optional)</Label>
              <Input
                id="viewing_slot_id"
                value={form.viewing_slot_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, viewing_slot_id: e.target.value }))
                }
                placeholder="UUID of the viewing slot"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Interest level</Label>
            <StarRating
              value={form.interest_level}
              onChange={(v) => setForm((f) => ({ ...f, interest_level: v }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Price opinion</Label>
            <div className="flex flex-wrap gap-2">
              {(["too_high", "about_right", "good_value"] as PriceOpinion[]).map(
                (op) => (
                  <label key={op} className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="radio"
                      name="price_opinion"
                      value={op}
                      checked={form.price_opinion === op}
                      onChange={() =>
                        setForm((f) => ({ ...f, price_opinion: op }))
                      }
                      className="accent-primary"
                    />
                    <span className="text-sm">{priceOpinionLabel(op)}</span>
                  </label>
                ),
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Likelihood to offer</Label>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  "unlikely",
                  "possible",
                  "likely",
                  "very_likely",
                ] as LikelihoodToOffer[]
              ).map((lh) => (
                <label key={lh} className="flex cursor-pointer items-center gap-1.5">
                  <input
                    type="radio"
                    name="likelihood_to_offer"
                    value={lh}
                    checked={form.likelihood_to_offer === lh}
                    onChange={() =>
                      setForm((f) => ({ ...f, likelihood_to_offer: lh }))
                    }
                    className="accent-primary"
                  />
                  <span className="text-sm">{likelihoodLabel(lh)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="comments">Comments</Label>
            <Textarea
              id="comments"
              value={form.comments}
              onChange={(e) =>
                setForm((f) => ({ ...f, comments: e.target.value }))
              }
              placeholder="Notes from the viewing…"
              rows={3}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit Feedback"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ViewingFeedbackForm({
  feedbacks,
}: Readonly<{ feedbacks: AgentViewingFeedback[] }>) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      {/* Toggle add form */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => setShowForm((v) => !v)}>
          <Plus className="mr-1 size-4" />
          {showForm ? "Hide Form" : "Add Feedback"}
        </Button>
      </div>

      {showForm && (
        <AddFeedbackForm onAdded={() => setShowForm(false)} />
      )}

      {/* Existing feedback */}
      {feedbacks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="mb-3 size-10 text-muted-foreground" />
            <p className="font-medium">No feedback yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Feedback submitted after viewings will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {feedbacks.length} feedback record{feedbacks.length !== 1 ? "s" : ""}
          </p>
          {feedbacks.map((fb) => (
            <FeedbackCard key={fb.id} feedback={fb} />
          ))}
        </div>
      )}
    </div>
  );
}
