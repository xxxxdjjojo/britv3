"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Eye, EyeOff, Send } from "lucide-react";
import Link from "next/link";

type Review = {
  id: string;
  rating: number;
  review_text?: string;
  reviewer_name?: string;
  created_at: string;
  agent_response?: string;
  responded_at?: string;
};

const PROFANITY_LIST = [
  "damn",
  "hell",
  "crap",
  "ass",
  "bastard",
  "bitch",
  "shit",
  "fuck",
  "piss",
  "dick",
  "cock",
  "cunt",
  "twat",
  "wank",
  "bollocks",
  "arse",
  "bloody",
  "bugger",
  "shite",
  "arsehole",
  "wanker",
  "tosser",
  "pillock",
  "muppet",
  "bellend",
  "knobhead",
  "numpty",
  "twit",
  "prat",
  "git",
  "plonker",
  "sod",
  "blimey",
  "idiot",
  "moron",
  "stupid",
  "dumbass",
  "jackass",
  "douchebag",
  "asshole",
  "motherfucker",
  "goddamn",
  "jesus christ",
  "christ",
] as const;

function checkProfanity(text: string): string[] {
  const lower = text.toLowerCase();
  return PROFANITY_LIST.filter((word) => lower.includes(word));
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="text-lg" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={
            star <= rating ? "text-brand-secondary" : "text-neutral-200"
          }
        >
          ★
        </span>
      ))}
    </span>
  );
}

type Props = Readonly<{ review: Review }>;

export function ReviewResponseForm({ review }: Props) {
  const router = useRouter();
  const [response, setResponse] = useState(review.agent_response ?? "");
  const [isPreview, setIsPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const charCount = response.length;
  const isNearLimit = charCount > 480;

  const dateStr = new Date(review.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  async function handleSubmit() {
    setError(null);
    const flagged = checkProfanity(response);
    if (flagged.length > 0) {
      setError(
        "Response contains inappropriate language. Please revise before submitting.",
      );
      return;
    }
    if (response.trim().length < 10) {
      setError("Response must be at least 10 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/agent/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: review.id,
          agent_response: response.trim(),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ?? "Failed to submit response",
        );
      }

      toast.success("Response submitted successfully");
      router.push("/dashboard/agent/reviews");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Back link */}
      <Button asChild variant="ghost" size="sm" className="-ml-2 rounded-xl">
        <Link href="/dashboard/agent/reviews">
          <ArrowLeft className="mr-1.5 size-4" />
          Back to Reviews
        </Link>
      </Button>

      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-neutral-900">
          Respond to Review
        </h1>
        <p className="mt-0.5 text-sm text-neutral-500">
          Write a professional public response
        </p>
      </div>

      {/* Original review */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="bg-neutral-50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Original Review
          </p>
        </div>
        <div className="px-5 py-4 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-semibold text-neutral-900">
              {review.reviewer_name ?? "Anonymous"}
            </p>
            <StarDisplay rating={review.rating} />
            <span className="text-sm text-neutral-400">{dateStr}</span>
            {review.agent_response && (
              <span className="inline-flex rounded-full bg-success-light px-2.5 py-0.5 text-[10px] font-semibold text-success">
                Already responded
              </span>
            )}
          </div>
          {review.review_text && (
            <p className="text-sm leading-relaxed text-neutral-700">
              {review.review_text}
            </p>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-neutral-100" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-neutral-50 px-3 text-xs font-semibold tracking-widest text-neutral-400">
            Your Response
          </span>
        </div>
      </div>

      {/* Response input / preview */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="flex items-center justify-between bg-neutral-50 px-5 py-4">
          <p className="font-semibold text-neutral-900">
            {isPreview ? "Preview" : "Write Response"}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-xl text-neutral-500 hover:text-neutral-800"
            onClick={() => setIsPreview(!isPreview)}
          >
            {isPreview ? (
              <>
                <EyeOff className="mr-1.5 size-4" />
                Edit
              </>
            ) : (
              <>
                <Eye className="mr-1.5 size-4" />
                Preview
              </>
            )}
          </Button>
        </div>
        <div className="p-5 space-y-4">
          {isPreview ? (
            <div className="rounded-xl bg-brand-primary-lighter p-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-brand-primary">
                Agency Response
              </p>
              <p className="text-sm leading-relaxed text-neutral-700">
                {response || (
                  <span className="italic text-neutral-400">
                    No response written yet.
                  </span>
                )}
              </p>
            </div>
          ) : (
            <>
              <Textarea
                value={response}
                onChange={(e) => {
                  setResponse(e.target.value);
                  setError(null);
                }}
                maxLength={500}
                rows={6}
                placeholder="Write a professional, helpful response to this review…"
                className="resize-none rounded-lg bg-neutral-50"
              />
              <div className="flex items-center justify-between text-xs">
                <span
                  className={
                    isNearLimit
                      ? "font-semibold text-error"
                      : "text-neutral-400"
                  }
                >
                  {charCount}/500
                </span>
                <span className="text-neutral-400">
                  Be professional and constructive
                </span>
              </div>
            </>
          )}

          {error && (
            <div className="rounded-xl bg-error-light px-4 py-3">
              <p className="text-sm font-medium text-error">{error}</p>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || response.trim().length < 10}
            className="w-full rounded-xl bg-brand-primary text-white hover:bg-brand-primary/90"
          >
            {isSubmitting ? (
              "Submitting…"
            ) : (
              <>
                <Send className="mr-2 size-4" />
                Submit Response
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
