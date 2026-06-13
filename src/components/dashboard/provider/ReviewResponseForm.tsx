"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, AlertTriangle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReviewRow } from "@/components/dashboard/provider/ReviewCard";

const MAX_CHARS = 500;
const MIN_CHARS = 10;

function ReadOnlyReview({ review }: Readonly<{ review: ReviewRow }>) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-neutral-800">
            {review.reviewer_name}
          </p>
          <p className="mt-0.5 text-xs text-neutral-400">
            {new Date(review.created_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div
          className="flex items-center gap-0.5"
          aria-label={`${review.overall_rating} out of 5 stars`}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              className={`size-4 ${
                n <= review.overall_rating
                  ? "fill-amber-400 text-amber-400"
                  : "fill-neutral-200 text-neutral-200"
              }`}
            />
          ))}
        </div>
      </div>
      {review.comment && (
        <p className="mt-3 text-sm leading-relaxed text-neutral-600">
          {review.comment}
        </p>
      )}
    </div>
  );
}

type ReviewResponseFormProps = Readonly<{
  review: ReviewRow;
}>;

export function ReviewResponseForm({ review }: ReviewResponseFormProps) {
  const router = useRouter();
  const [response, setResponse] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const charsLeft = MAX_CHARS - response.length;
  const isValid = response.trim().length >= MIN_CHARS && response.length <= MAX_CHARS;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/provider/reviews/${review.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: response.trim() }),
      });

      if (res.status === 409) {
        setError("You have already responded to this review.");
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(
          (body as { error?: string }).error ?? "Failed to submit response. Please try again.",
        );
        return;
      }

      // Success — navigate back to reviews list
      router.push("/dashboard/provider/reviews");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Original review (read-only) */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Original Review
        </h2>
        <ReadOnlyReview review={review} />
      </div>

      {/* Guidelines */}
      <div className="flex items-start gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
        <p>
          <strong>Your response is public and cannot be edited.</strong> Keep it
          professional and address the client&apos;s feedback constructively.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="provider-response"
            className="mb-1.5 block text-sm font-medium text-neutral-700"
          >
            Your Response
          </label>
          <textarea
            id="provider-response"
            rows={6}
            placeholder="Write a professional response to this review…"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            disabled={submitting}
            maxLength={MAX_CHARS}
            className="w-full resize-none rounded-lg border border-neutral-200 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 disabled:opacity-60"
          />
          <div className="mt-1 flex justify-between text-xs">
            <span className="text-neutral-400">
              Minimum {MIN_CHARS} characters
            </span>
            <span
              className={`font-medium ${
                charsLeft < 50
                  ? charsLeft < 10
                    ? "text-red-600"
                    : "text-amber-600"
                  : "text-neutral-400"
              }`}
            >
              {charsLeft} left
            </span>
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 sm:flex-none sm:min-w-[100px]"
            onClick={() => router.back()}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!isValid || submitting}
            className="flex-1 bg-brand-primary text-white hover:bg-[#163d31] sm:flex-none sm:min-w-[140px]"
          >
            <Send className="mr-1.5 size-4" />
            {submitting ? "Submitting…" : "Post Response"}
          </Button>
        </div>
      </form>
    </div>
  );
}
