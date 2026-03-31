"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Star, MessageSquare } from "lucide-react";
import type {
  AgentViewingFeedback,
  PriceOpinion,
  LikelihoodToOffer,
} from "@/types/agent";

// ── Stars rating ─────────────────────────────────────────────────────────────

function StarRating({
  value,
  onChange,
  readOnly = false,
}: Readonly<{
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
}>) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <button
          key={i}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(i + 1)}
          className={`size-6 transition-transform disabled:cursor-default ${
            !readOnly && "hover:scale-110"
          }`}
        >
          <Star
            className={`size-6 transition-colors ${
              i < value ? "text-brand-secondary fill-brand-secondary" : "text-neutral-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ── Price opinion config ───────────────────────────────────────────────────────

function priceOpinionConfig(opinion: PriceOpinion) {
  switch (opinion) {
    case "too_high":
      return {
        bg: "bg-error-light",
        text: "text-error",
        label: "Too high",
      };
    case "about_right":
      return {
        bg: "bg-warning-light",
        text: "text-warning",
        label: "About right",
      };
    default:
      return {
        bg: "bg-success-light",
        text: "text-success",
        label: "Good value",
      };
  }
}

function likelihoodConfig(likelihood: LikelihoodToOffer) {
  switch (likelihood) {
    case "unlikely":
      return { bg: "bg-error-light", text: "text-error", label: "Unlikely" };
    case "possible":
      return { bg: "bg-warning-light", text: "text-warning", label: "Possible" };
    case "likely":
      return { bg: "bg-info-light", text: "text-info", label: "Likely" };
    default:
      return {
        bg: "bg-success-light",
        text: "text-success",
        label: "Very likely",
      };
  }
}

// ── Feedback card ─────────────────────────────────────────────────────────────

function FeedbackCard({ feedback }: Readonly<{ feedback: AgentViewingFeedback }>) {
  const priceCfg = priceOpinionConfig(feedback.price_opinion);
  const likeCfg = likelihoodConfig(feedback.likelihood_to_offer);

  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/60">
      {/* Header */}
      <div className="bg-muted/30 px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-neutral-900">
              {feedback.buyer_name}
            </p>
            <p className="text-xs text-neutral-400">
              {new Date(feedback.created_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${priceCfg.bg} ${priceCfg.text}`}
            >
              {priceCfg.label}
            </span>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${likeCfg.bg} ${likeCfg.text}`}
            >
              {likeCfg.label}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        <StarRating value={feedback.interest_level} readOnly />

        {feedback.comments && (
          <p className="mt-2.5 text-sm leading-relaxed text-neutral-700">
            {feedback.comments}
          </p>
        )}

        {feedback.viewing_slot_id && (
          <p className="mt-2 text-xs text-neutral-400">
            Slot: {feedback.viewing_slot_id.slice(0, 8)}…
          </p>
        )}
      </div>
    </div>
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

function RadioChip({
  name,
  value,
  checked,
  onChange,
  label,
  bg,
  text,
}: Readonly<{
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  bg: string;
  text: string;
}>) {
  return (
    <label className="cursor-pointer">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold transition-all ${
          checked
            ? `${bg} ${text} ring-2 ring-offset-1 ring-current`
            : "bg-neutral-100 text-neutral-400 hover:bg-neutral-200"
        }`}
      >
        {label}
      </span>
    </label>
  );
}

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

  const priceOptions: PriceOpinion[] = ["too_high", "about_right", "good_value"];
  const likeOptions: LikelihoodToOffer[] = [
    "unlikely",
    "possible",
    "likely",
    "very_likely",
  ];

  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/60">
      <div className="bg-muted/30 px-6 py-4">
        <p className="font-heading text-sm font-semibold text-foreground">Add Viewing Feedback</p>
      </div>
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="buyer_name"
                className="text-sm font-medium text-neutral-700"
              >
                Buyer name *
              </Label>
              <Input
                id="buyer_name"
                value={form.buyer_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, buyer_name: e.target.value }))
                }
                placeholder="e.g. John Smith"
                className="rounded-xl bg-neutral-50"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="viewing_slot_id"
                className="text-sm font-medium text-neutral-700"
              >
                Viewing slot ID (optional)
              </Label>
              <Input
                id="viewing_slot_id"
                value={form.viewing_slot_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, viewing_slot_id: e.target.value }))
                }
                placeholder="UUID of the viewing slot"
                className="rounded-xl bg-neutral-50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-neutral-700">
              Interest level
            </Label>
            <StarRating
              value={form.interest_level}
              onChange={(v) => setForm((f) => ({ ...f, interest_level: v }))}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-neutral-700">
              Price opinion
            </Label>
            <div className="flex flex-wrap gap-2">
              {priceOptions.map((op) => {
                const cfg = priceOpinionConfig(op);
                return (
                  <RadioChip
                    key={op}
                    name="price_opinion"
                    value={op}
                    checked={form.price_opinion === op}
                    onChange={() => setForm((f) => ({ ...f, price_opinion: op }))}
                    label={cfg.label}
                    bg={cfg.bg}
                    text={cfg.text}
                  />
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-neutral-700">
              Likelihood to offer
            </Label>
            <div className="flex flex-wrap gap-2">
              {likeOptions.map((lh) => {
                const cfg = likelihoodConfig(lh);
                return (
                  <RadioChip
                    key={lh}
                    name="likelihood_to_offer"
                    value={lh}
                    checked={form.likelihood_to_offer === lh}
                    onChange={() =>
                      setForm((f) => ({ ...f, likelihood_to_offer: lh }))
                    }
                    label={cfg.label}
                    bg={cfg.bg}
                    text={cfg.text}
                  />
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="comments"
              className="text-sm font-medium text-neutral-700"
            >
              Comments
            </Label>
            <Textarea
              id="comments"
              value={form.comments}
              onChange={(e) =>
                setForm((f) => ({ ...f, comments: e.target.value }))
              }
              placeholder="Notes from the viewing…"
              rows={3}
              className="resize-none rounded-xl bg-neutral-50"
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-brand-primary text-white hover:bg-brand-primary/90"
            >
              {submitting ? "Submitting…" : "Submit Feedback"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ViewingFeedbackForm({
  feedbacks,
}: Readonly<{ feedbacks: AgentViewingFeedback[] }>) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-5">
      {/* Toggle add form */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          className="rounded-xl"
          onClick={() => setShowForm((v) => !v)}
        >
          <Plus className="mr-1.5 size-4" />
          {showForm ? "Hide Form" : "Add Feedback"}
        </Button>
      </div>

      {showForm && (
        <AddFeedbackForm onAdded={() => setShowForm(false)} />
      )}

      {/* Existing feedback */}
      {feedbacks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-neutral-50 py-16 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
            <MessageSquare className="size-6 text-muted-foreground" />
          </div>
          <p className="font-heading font-semibold text-foreground">No feedback yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Feedback submitted after viewings will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-neutral-500">
            {feedbacks.length} feedback record
            {feedbacks.length !== 1 ? "s" : ""}
          </p>
          {feedbacks.map((fb) => (
            <FeedbackCard key={fb.id} feedback={fb} />
          ))}
        </div>
      )}
    </div>
  );
}
