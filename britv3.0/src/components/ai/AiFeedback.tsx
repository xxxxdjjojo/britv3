"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { AiFeedbackRating } from "@/services/ai/types";

type AiFeedbackProps = Readonly<{
  featureId: string;
  referenceId: string;
  onFeedback?: (rating: AiFeedbackRating) => void;
}>;

export function AiFeedback({ featureId, referenceId, onFeedback }: AiFeedbackProps) {
  const [submitted, setSubmitted] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRating, setSelectedRating] = useState<AiFeedbackRating | null>(null);

  const submitFeedback = async (rating: AiFeedbackRating, feedbackComment?: string) => {
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("ai_feedback").insert({
        feature: featureId,
        reference_id: referenceId,
        user_id: user.id,
        rating,
        comment: feedbackComment ?? null,
      });

      setSubmitted(true);
      onFeedback?.(rating);
    } catch (err) {
      console.error("[AI Feedback] Error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleThumbsUp = () => {
    submitFeedback("positive");
  };

  const handleThumbsDown = () => {
    setSelectedRating("negative");
    setShowComment(true);
  };

  const handleCommentSubmit = () => {
    submitFeedback("negative", comment || undefined);
  };

  if (submitted) {
    return (
      <p className="text-xs text-muted-foreground">
        Thanks for your feedback
      </p>
    );
  }

  return (
    <div className="inline-flex flex-col gap-2">
      <div className="inline-flex items-center gap-1">
        <span className="text-xs text-muted-foreground mr-1">Was this helpful?</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleThumbsUp}
          disabled={isSubmitting || showComment}
          aria-label="Thumbs up"
        >
          <ThumbsUp className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleThumbsDown}
          disabled={isSubmitting || showComment}
          aria-label="Thumbs down"
        >
          <ThumbsDown className="h-3.5 w-3.5" />
        </Button>
      </div>

      {showComment && (
        <div className="flex flex-col gap-2">
          <textarea
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="What could be improved? (optional)"
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={isSubmitting}
          />
          <Button
            size="sm"
            onClick={handleCommentSubmit}
            disabled={isSubmitting}
          >
            Submit Feedback
          </Button>
        </div>
      )}
    </div>
  );
}
