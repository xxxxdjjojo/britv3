"use client";

import { useState } from "react";
import type {
  AgentViewingFeedback,
  InterestLevel,
  PriceOpinion,
  LikelihoodToOffer,
} from "@/types/agent";
import {
  INTEREST_LEVELS,
  PRICE_OPINIONS,
  LIKELIHOOD_TO_OFFER,
} from "@/types/agent";

const PRICE_OPINION_LABELS: Record<PriceOpinion, string> = {
  too_high: "Too High",
  about_right: "About Right",
  good_value: "Good Value",
};

const LIKELIHOOD_LABELS: Record<LikelihoodToOffer, string> = {
  unlikely: "Unlikely",
  possible: "Possible",
  likely: "Likely",
  very_likely: "Very Likely",
};

function renderStars(level: InterestLevel): string {
  return "\u2605".repeat(level) + "\u2606".repeat(5 - level);
}

export function ViewingFeedbackForm(
  props: Readonly<{ initialFeedback: AgentViewingFeedback[] }>,
) {
  const [feedback, setFeedback] = useState<AgentViewingFeedback[]>(
    props.initialFeedback,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form fields
  const [viewingSlotId, setViewingSlotId] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [interestLevel, setInterestLevel] = useState<InterestLevel>(3);
  const [priceOpinion, setPriceOpinion] = useState<PriceOpinion>("about_right");
  const [likelihood, setLikelihood] = useState<LikelihoodToOffer>("possible");
  const [comments, setComments] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);

    try {
      const res = await fetch("/api/agent/viewings/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          viewing_slot_id: viewingSlotId,
          buyer_name: buyerName,
          interest_level: interestLevel,
          price_opinion: priceOpinion,
          likelihood_to_offer: likelihood,
          comments: comments || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to submit feedback");
      }

      const { feedback: newFeedback } = (await res.json()) as {
        feedback: AgentViewingFeedback;
      };
      setFeedback((prev) => [newFeedback, ...prev]);
      setSuccess(true);
      setViewingSlotId("");
      setBuyerName("");
      setInterestLevel(3);
      setPriceOpinion("about_right");
      setLikelihood("possible");
      setComments("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Viewing Feedback</h1>
        <p className="text-muted-foreground">
          Collect and review feedback from property viewings
        </p>
      </div>

      {/* Collect Feedback Form */}
      <div className="rounded-lg border bg-white p-4 dark:bg-gray-900">
        <h3 className="mb-3 text-sm font-semibold">Collect Feedback</h3>
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        {success && (
          <p className="mb-3 text-sm text-green-600">
            Feedback submitted successfully.
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                Viewing Slot ID
              </span>
              <input
                type="text"
                required
                placeholder="UUID of the viewing slot"
                value={viewingSlotId}
                onChange={(e) => setViewingSlotId(e.target.value)}
                className="w-full rounded border px-3 py-1.5 text-sm dark:bg-gray-800"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                Buyer Name
              </span>
              <input
                type="text"
                required
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="w-full rounded border px-3 py-1.5 text-sm dark:bg-gray-800"
              />
            </label>
          </div>

          {/* Interest Level */}
          <fieldset>
            <legend className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">
              Interest Level
            </legend>
            <div className="flex gap-4">
              {INTEREST_LEVELS.map((level) => (
                <label key={level} className="flex items-center gap-1 text-sm">
                  <input
                    type="radio"
                    name="interest_level"
                    value={level}
                    checked={interestLevel === level}
                    onChange={() => setInterestLevel(level)}
                  />
                  {level}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Price Opinion */}
          <fieldset>
            <legend className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">
              Price Opinion
            </legend>
            <div className="flex gap-4">
              {PRICE_OPINIONS.map((opinion) => (
                <label key={opinion} className="flex items-center gap-1 text-sm">
                  <input
                    type="radio"
                    name="price_opinion"
                    value={opinion}
                    checked={priceOpinion === opinion}
                    onChange={() => setPriceOpinion(opinion)}
                  />
                  {PRICE_OPINION_LABELS[opinion]}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Likelihood to Offer */}
          <fieldset>
            <legend className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">
              Likelihood to Offer
            </legend>
            <div className="flex gap-4">
              {LIKELIHOOD_TO_OFFER.map((l) => (
                <label key={l} className="flex items-center gap-1 text-sm">
                  <input
                    type="radio"
                    name="likelihood_to_offer"
                    value={l}
                    checked={likelihood === l}
                    onChange={() => setLikelihood(l)}
                  />
                  {LIKELIHOOD_LABELS[l]}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Comments */}
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Comments (optional)
            </span>
            <textarea
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full rounded border px-3 py-1.5 text-sm dark:bg-gray-800"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Feedback"}
          </button>
        </form>
      </div>

      {/* Existing Feedback List */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">
          Previous Feedback ({feedback.length})
        </h3>
        {feedback.length === 0 ? (
          <p className="text-sm text-gray-500">No feedback collected yet.</p>
        ) : (
          feedback.map((fb) => (
            <div
              key={fb.id}
              className="rounded-lg border bg-white p-4 dark:bg-gray-900"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{fb.buyer_name}</p>
                  <p className="text-xs text-gray-500">
                    Slot: {fb.viewing_slot_id.slice(0, 8)}... |{" "}
                    {new Date(fb.created_at).toLocaleDateString("en-GB")}
                  </p>
                </div>
                <span className="text-lg tracking-wide text-amber-500">
                  {renderStars(fb.interest_level)}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {fb.price_opinion && (
                  <span
                    className={[
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      fb.price_opinion === "too_high"
                        ? "bg-red-100 text-red-700"
                        : fb.price_opinion === "good_value"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700",
                    ].join(" ")}
                  >
                    {PRICE_OPINION_LABELS[fb.price_opinion]}
                  </span>
                )}
                {fb.likelihood_to_offer && (
                  <span
                    className={[
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      fb.likelihood_to_offer === "very_likely"
                        ? "bg-green-100 text-green-700"
                        : fb.likelihood_to_offer === "likely"
                          ? "bg-blue-100 text-blue-700"
                          : fb.likelihood_to_offer === "possible"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-100 text-gray-600",
                    ].join(" ")}
                  >
                    {LIKELIHOOD_LABELS[fb.likelihood_to_offer]}
                  </span>
                )}
              </div>
              {fb.comments && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {fb.comments}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
