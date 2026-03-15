"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Star, Eye, EyeOff, Send } from "lucide-react";
import type { AgentReview } from "./ReviewsDashboard";

// ============================================================================
// Profanity list — kept intentionally minimal (expand as needed)
// ============================================================================

const PROFANITY_LIST = new Set([
  "arse", "ass", "asshole", "bastard", "bitch", "bollocks", "bugger",
  "bullshit", "cock", "crap", "cunt", "damn", "dick", "dickhead",
  "dumbass", "fag", "fuck", "fucker", "fucking", "git", "idiot",
  "jackass", "jerk", "knob", "moron", "motherfucker", "piss", "prick",
  "pussy", "shit", "shite", "slut", "son of a bitch", "stupid",
  "tit", "tosser", "twat", "wanker", "whore",
]);

function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase();
  for (const word of PROFANITY_LIST) {
    // Whole-word boundary check using regex
    const pattern = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (pattern.test(lower)) return true;
  }
  return false;
}

// ============================================================================
// Helpers
// ============================================================================

const MAX_CHARS = 500;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function StarDisplay({ rating }: Readonly<{ rating: number }>) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={16}
          className={
            i <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300 dark:text-gray-600"
          }
        />
      ))}
    </span>
  );
}

// ============================================================================
// ReviewResponseForm
// ============================================================================

export type ReviewResponseFormProps = Readonly<{
  review: AgentReview;
  reviewId: string;
}>;

export function ReviewResponseForm({ review, reviewId }: ReviewResponseFormProps) {
  const router = useRouter();
  const [responseText, setResponseText] = useState(review.agent_response ?? "");
  const [isPreview, setIsPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profanityWarning, setProfanityWarning] = useState(false);

  const charCount = responseText.length;
  const isOverLimit = charCount > MAX_CHARS;

  function handleChange(value: string) {
    setResponseText(value);
    setProfanityWarning(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!responseText.trim()) {
      toast.error("Please enter a response before submitting.");
      return;
    }
    if (isOverLimit) {
      toast.error(`Response must be ${MAX_CHARS} characters or fewer.`);
      return;
    }
    if (containsProfanity(responseText)) {
      setProfanityWarning(true);
      toast.error("Your response contains inappropriate language. Please revise it.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/agent/reviews/${reviewId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: responseText }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to submit response");
      }

      toast.success("Response published successfully.");
      router.push("/dashboard/agent/reviews");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit response");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Original review */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Review from {review.reviewer_name ?? "Anonymous"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <StarDisplay rating={review.rating} />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(review.created_at)}
            </span>
          </div>
          {review.review_text && (
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {review.review_text}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Response form or preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Your Public Response</CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => setIsPreview((p) => !p)}
            >
              {isPreview ? (
                <>
                  <EyeOff size={14} /> Edit
                </>
              ) : (
                <>
                  <Eye size={14} /> Preview
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isPreview ? (
            <div className="space-y-3">
              <div className="rounded-md bg-blue-50 px-4 py-3 dark:bg-blue-950">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">
                  Agent response (public)
                </p>
                <p className="text-sm text-blue-900 dark:text-blue-100 whitespace-pre-wrap leading-relaxed">
                  {responseText || (
                    <span className="italic text-gray-400">Your response will appear here.</span>
                  )}
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">
                This is how your response will appear to prospective clients.
              </Badge>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <Textarea
                value={responseText}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="Write a professional, helpful response to this review..."
                rows={5}
                className={`resize-none ${isOverLimit ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                disabled={isSubmitting}
              />
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span
                    className={`text-xs ${
                      isOverLimit
                        ? "text-red-600 dark:text-red-400 font-semibold"
                        : "text-gray-400"
                    }`}
                  >
                    {charCount} / {MAX_CHARS} characters
                  </span>
                  {profanityWarning && (
                    <span className="text-xs text-red-600 dark:text-red-400">
                      Please remove inappropriate language before submitting.
                    </span>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting || isOverLimit || !responseText.trim()}
                  className="gap-1.5"
                >
                  <Send size={14} />
                  {isSubmitting ? "Publishing..." : "Publish Response"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
