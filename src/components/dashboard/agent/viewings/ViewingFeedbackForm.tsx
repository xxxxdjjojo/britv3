"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  AgentViewingSlot,
  AgentViewingFeedback,
  PriceOpinion,
  LikelihoodToOffer,
} from "@/types/agent";
import { Star, MessageSquare } from "lucide-react";

// ============================================================================
// Star Rating component
// ============================================================================

type StarRatingProps = Readonly<{
  value: number;
  onChange: (v: number) => void;
}>;

function StarRating({ value, onChange }: StarRatingProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
          className="focus:outline-none"
        >
          <Star
            className={`size-6 transition-colors ${
              n <= value
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// Feedback display card (read-only)
// ============================================================================

const PRICE_OPINION_LABELS: Record<PriceOpinion, string> = {
  too_high: "Too high",
  about_right: "About right",
  good_value: "Good value",
};

const LIKELIHOOD_LABELS: Record<LikelihoodToOffer, string> = {
  unlikely: "Unlikely",
  possible: "Possible",
  likely: "Likely",
  very_likely: "Very likely",
};

const LIKELIHOOD_COLOURS: Record<LikelihoodToOffer, string> = {
  unlikely: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  possible: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  likely: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  very_likely: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

type FeedbackCardProps = Readonly<{
  feedback: AgentViewingFeedback;
}>;

function FeedbackCard({ feedback }: FeedbackCardProps) {
  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium">{feedback.buyer_name ?? "Anonymous buyer"}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(feedback.created_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {feedback.likelihood_to_offer && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${LIKELIHOOD_COLOURS[feedback.likelihood_to_offer]}`}
              >
                {LIKELIHOOD_LABELS[feedback.likelihood_to_offer]}
              </span>
            )}
            {feedback.price_opinion && (
              <Badge variant="outline" className="text-xs">
                {PRICE_OPINION_LABELS[feedback.price_opinion]}
              </Badge>
            )}
          </div>
        </div>
        {feedback.interest_level != null && (
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={`size-4 ${
                  n <= feedback.interest_level!
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground"
                }`}
              />
            ))}
            <span className="text-xs text-muted-foreground ml-1">
              ({feedback.interest_level}/5)
            </span>
          </div>
        )}
        {feedback.comments && (
          <p className="text-sm text-muted-foreground border-l-2 pl-3 italic">
            {feedback.comments}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Feedback collection form
// ============================================================================

type CollectFeedbackFormProps = Readonly<{
  slot: AgentViewingSlot;
  onSubmitted: () => void;
}>;

function CollectFeedbackForm({ slot, onSubmitted }: CollectFeedbackFormProps) {
  const [expanded, setExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    buyer_name: slot.booked_by ?? "",
    interest_level: 0,
    price_opinion: "" as PriceOpinion | "",
    likelihood_to_offer: "" as LikelihoodToOffer | "",
    comments: "",
  });

  if (!expanded) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Collect post-viewing feedback</p>
              <p className="text-xs text-muted-foreground">
                Slot on{" "}
                {new Date(slot.start_time).toLocaleDateString("en-GB", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}{" "}
                at {new Date(slot.start_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <Button size="sm" onClick={() => setExpanded(true)}>
              <MessageSquare className="mr-2 size-3" />
              Collect Feedback
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/agent/viewings/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          viewing_slot_id: slot.id,
          buyer_name: form.buyer_name || null,
          interest_level: form.interest_level > 0 ? form.interest_level : null,
          price_opinion: form.price_opinion || null,
          likelihood_to_offer: form.likelihood_to_offer || null,
          comments: form.comments || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Failed to submit feedback");
      }
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Collect Feedback</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label>Buyer name</Label>
          <input
            type="text"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="Buyer's name"
            value={form.buyer_name}
            onChange={(e) => setForm((f) => ({ ...f, buyer_name: e.target.value }))}
          />
        </div>

        <div className="space-y-1">
          <Label>Interest level</Label>
          <StarRating
            value={form.interest_level}
            onChange={(v) => setForm((f) => ({ ...f, interest_level: v }))}
          />
        </div>

        <div className="space-y-1">
          <Label>Price opinion</Label>
          <div className="flex gap-2">
            {(["too_high", "about_right", "good_value"] as PriceOpinion[]).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setForm((f) => ({ ...f, price_opinion: f.price_opinion === opt ? "" : opt }))}
                className={`flex-1 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                  form.price_opinion === opt
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input hover:bg-muted"
                }`}
              >
                {PRICE_OPINION_LABELS[opt]}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <Label>Likelihood to offer</Label>
          <div className="grid grid-cols-2 gap-2">
            {(["unlikely", "possible", "likely", "very_likely"] as LikelihoodToOffer[]).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() =>
                  setForm((f) => ({ ...f, likelihood_to_offer: f.likelihood_to_offer === opt ? "" : opt }))
                }
                className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                  form.likelihood_to_offer === opt
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input hover:bg-muted"
                }`}
              >
                {LIKELIHOOD_LABELS[opt]}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <Label>Comments (optional)</Label>
          <Textarea
            placeholder="Any additional notes from the buyer..."
            value={form.comments}
            onChange={(e) => setForm((f) => ({ ...f, comments: e.target.value }))}
            rows={3}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setExpanded(false)}>Cancel</Button>
          <Button onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit feedback"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main ViewingFeedbackForm component
// ============================================================================

type ViewingFeedbackFormProps = Readonly<{
  feedbackList: AgentViewingFeedback[];
  bookedSlotsWithoutFeedback: AgentViewingSlot[];
}>;

export function ViewingFeedbackForm({
  feedbackList,
  bookedSlotsWithoutFeedback,
}: ViewingFeedbackFormProps) {
  const [submittedSlotIds, setSubmittedSlotIds] = useState<Set<string>>(new Set());

  function handleSubmitted(slotId: string) {
    setSubmittedSlotIds((prev) => new Set([...prev, slotId]));
  }

  const pendingSlots = bookedSlotsWithoutFeedback.filter(
    (s) => !submittedSlotIds.has(s.id),
  );

  return (
    <div className="space-y-6">
      {pendingSlots.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Feedback to collect ({pendingSlots.length})</h2>
          {pendingSlots.map((slot) => (
            <CollectFeedbackForm
              key={slot.id}
              slot={slot}
              onSubmitted={() => handleSubmitted(slot.id)}
            />
          ))}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-base font-semibold">
          Feedback received ({feedbackList.length})
        </h2>
        {feedbackList.length === 0 ? (
          <p className="text-sm text-muted-foreground">No feedback received yet.</p>
        ) : (
          feedbackList.map((fb) => <FeedbackCard key={fb.id} feedback={fb} />)
        )}
      </div>
    </div>
  );
}
