"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  "damn", "hell", "crap", "ass", "bastard", "bitch", "shit", "fuck", "piss",
  "dick", "cock", "cunt", "twat", "wank", "bollocks", "arse", "bloody", "bugger",
  "shite", "arsehole", "wanker", "tosser", "pillock", "muppet", "bellend",
  "knobhead", "numpty", "twit", "prat", "git", "plonker", "sod", "blimey",
  "idiot", "moron", "stupid", "dumbass", "jackass", "douchebag", "asshole",
  "motherfucker", "goddamn", "jesus christ", "christ",
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
          className={star <= rating ? "text-yellow-400" : "text-muted-foreground/30"}
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
      setError("Response contains inappropriate language. Please revise before submitting.");
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
        body: JSON.stringify({ id: review.id, agent_response: response.trim() }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Failed to submit response");
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
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/dashboard/agent/reviews">
            <ArrowLeft className="mr-1.5 size-4" />
            Back to Reviews
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Respond to Review</h1>
        <p className="text-muted-foreground">Write a professional public response</p>
      </div>

      {/* Review display */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-base">Original Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="font-medium">{review.reviewer_name ?? "Anonymous"}</p>
            <StarDisplay rating={review.rating} />
            <span className="text-sm text-muted-foreground">{dateStr}</span>
            {review.agent_response && (
              <Badge variant="secondary">Already responded</Badge>
            )}
          </div>
          {review.review_text && (
            <p className="text-sm leading-relaxed">{review.review_text}</p>
          )}
        </CardContent>
      </Card>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Your response</span>
        </div>
      </div>

      {/* Response input / preview */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="font-heading text-base">
            {isPreview ? "Preview" : "Write Response"}
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
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
        </CardHeader>
        <CardContent className="space-y-3">
          {isPreview ? (
            <div className="rounded-md border bg-muted/40 p-4 text-sm leading-relaxed">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Agency Response
              </p>
              <p>{response || <span className="italic text-muted-foreground">No response written yet.</span>}</p>
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
                placeholder="Write a professional, helpful response to this review..."
                className="resize-none"
              />
              <div className="flex items-center justify-between text-xs">
                <span className={isNearLimit ? "text-destructive font-medium" : "text-muted-foreground"}>
                  {charCount}/500
                </span>
                <span className="text-muted-foreground">Be professional and constructive</span>
              </div>
            </>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || response.trim().length < 10}
            className="w-full"
          >
            {isSubmitting ? (
              "Submitting..."
            ) : (
              <>
                <Send className="mr-2 size-4" />
                Submit Response
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
