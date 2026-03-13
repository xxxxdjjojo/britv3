"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ReviewRow = {
  id: string;
  rating: number;
  content: string | null;
  reviewer_id: string | null;
  reviewed_entity_id: string;
  agent_response: string | null;
  responded_at: string | null;
  created_at: string;
  reviewer_name: string | null;
};

const MAX_RESPONSE_LENGTH = 500;

const BLOCKED_WORDS = [
  "damn", "hell", "crap", "stupid", "idiot", "moron", "dumb",
  "fool", "jerk", "loser", "shut up", "suck", "hate",
  "ugly", "pathetic", "useless", "incompetent", "terrible",
  "horrible", "disgusting",
];

function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase();
  return BLOCKED_WORDS.some((w) => lower.includes(w));
}

function StarIcon(props: Readonly<{ filled: boolean }>) {
  return (
    <svg
      className={`h-5 w-5 ${props.filled ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

export function ReviewResponseForm(
  props: Readonly<{ review: ReviewRow }>,
) {
  const { review } = props;
  const router = useRouter();

  const [response, setResponse] = useState(review.agent_response ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const trimmed = response.trim();
    if (!trimmed) {
      setError("Response cannot be empty.");
      return;
    }

    if (trimmed.length > MAX_RESPONSE_LENGTH) {
      setError(`Response must be ${MAX_RESPONSE_LENGTH} characters or fewer.`);
      return;
    }

    if (containsProfanity(trimmed)) {
      setError(
        "Your response contains inappropriate language. Please revise before submitting.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/agent/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: review.id, agent_response: trimmed }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to submit response");
      }

      setSuccess(true);
      setTimeout(() => router.push("/dashboard/agent/reviews"), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Respond to Review
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Write a professional response to this client review.
        </p>
      </div>

      {/* Original review */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <StarIcon key={s} filled={s <= Math.round(review.rating)} />
            ))}
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {review.reviewer_name ?? "Anonymous"}
          </span>
          <span className="text-xs text-gray-400">
            {new Date(review.created_at).toLocaleDateString("en-GB")}
          </span>
        </div>
        {review.content && (
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
            {review.content}
          </p>
        )}
      </div>

      {/* Response form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="agent-response"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Your Response
          </label>
          <textarea
            id="agent-response"
            rows={5}
            maxLength={MAX_RESPONSE_LENGTH}
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="Write a professional response..."
          />
          <p className="mt-1 text-xs text-gray-400">
            {response.length}/{MAX_RESPONSE_LENGTH} characters
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Response submitted successfully! Redirecting...
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Response"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/agent/reviews")}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
