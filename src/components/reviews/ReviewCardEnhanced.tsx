"use client";

import { useState, useCallback } from "react";
import { ThumbsUp, ThumbsDown, Flag, Pencil, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/reviews/RatingStars";
import { ReportReviewModal } from "@/components/reviews/ReportReviewModal";
import { cn } from "@/lib/utils";
import type { Review } from "@/types/marketplace";

type ReviewCardEnhancedProps = Readonly<{
  review: Review;
  currentUserId?: string;
  onEdit?: (review: Review) => void;
}>;

export function ReviewCardEnhanced({
  review,
  currentUserId,
  onEdit,
}: ReviewCardEnhancedProps) {
  const [helpfulCount, setHelpfulCount] = useState(review.helpful_count);
  const [notHelpfulCount, setNotHelpfulCount] = useState(review.not_helpful_count);
  const [userVote, setUserVote] = useState<boolean | null>(null);
  const [votePending, setVotePending] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const isOwnReview = currentUserId === review.reviewer_id;
  const canEdit =
    isOwnReview &&
    review.edit_count < 2 &&
    new Date(review.created_at).getTime() + 48 * 60 * 60 * 1000 > Date.now();

  const dateStr = new Date(review.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const handleVote = useCallback(
    async (isHelpful: boolean) => {
      if (votePending || isOwnReview) return;

      // Optimistic update
      const prevHelpful = helpfulCount;
      const prevNotHelpful = notHelpfulCount;
      const prevVote = userVote;

      if (userVote === isHelpful) return; // Same vote, no-op

      // Undo previous vote if changing
      if (userVote !== null) {
        if (userVote) setHelpfulCount((c) => Math.max(0, c - 1));
        else setNotHelpfulCount((c) => Math.max(0, c - 1));
      }

      // Apply new vote
      if (isHelpful) setHelpfulCount((c) => c + 1);
      else setNotHelpfulCount((c) => c + 1);
      setUserVote(isHelpful);

      setVotePending(true);
      try {
        const response = await fetch(`/api/reviews/${review.id}/helpful`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_helpful: isHelpful }),
        });

        if (!response.ok) {
          throw new Error("Vote failed");
        }

        const data = await response.json();
        setHelpfulCount(data.data?.helpful_count ?? data.helpful_count ?? helpfulCount);
        setNotHelpfulCount(data.data?.not_helpful_count ?? data.not_helpful_count ?? notHelpfulCount);
      } catch {
        // Rollback optimistic update
        setHelpfulCount(prevHelpful);
        setNotHelpfulCount(prevNotHelpful);
        setUserVote(prevVote);
        toast.error("Failed to record vote. Please try again.");
      } finally {
        setVotePending(false);
      }
    },
    [review.id, helpfulCount, notHelpfulCount, userVote, votePending, isOwnReview],
  );

  return (
    <>
      <div className="border-b border-border py-5 last:border-0">
        {/* Header: rating + date + badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <RatingStars rating={review.overall_rating} size="sm" />
            <h4 className="font-medium text-foreground">{review.title}</h4>
          </div>
          <div className="flex items-center gap-2">
            {review.edited_at && (
              <Badge variant="outline" className="text-xs">
                <Pencil className="mr-1 size-3" />
                Edited
              </Badge>
            )}
            {review.is_incentivised && (
              <Badge variant="outline" className="text-xs border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                Incentivised
              </Badge>
            )}
            {review.moderation_status === "approved" && (
              <Badge variant="outline" className="border-green-200 bg-green-50 text-xs text-green-700 dark:bg-green-900/20 dark:text-green-400">
                <CheckCircle className="mr-1 size-3" />
                Verified
              </Badge>
            )}
            <span className="shrink-0 text-xs text-muted-foreground">{dateStr}</span>
          </div>
        </div>

        {/* Review text */}
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          {review.review_text}
        </p>

        {/* Sub-ratings (if any) */}
        {(review.punctuality_rating || review.quality_rating || review.value_rating || review.professionalism_rating) && (
          <div className="mt-3 flex flex-wrap gap-3">
            {review.punctuality_rating && (
              <span className="text-xs text-muted-foreground">
                Punctuality: <strong>{review.punctuality_rating}/5</strong>
              </span>
            )}
            {review.quality_rating && (
              <span className="text-xs text-muted-foreground">
                Quality: <strong>{review.quality_rating}/5</strong>
              </span>
            )}
            {review.value_rating && (
              <span className="text-xs text-muted-foreground">
                Value: <strong>{review.value_rating}/5</strong>
              </span>
            )}
            {review.professionalism_rating && (
              <span className="text-xs text-muted-foreground">
                Professionalism: <strong>{review.professionalism_rating}/5</strong>
              </span>
            )}
          </div>
        )}

        {/* Provider response */}
        {review.provider_response && (
          <div className="mt-3 rounded-lg bg-brand-primary/5 p-3 border-l-4 border-brand-primary">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Provider response</p>
            <p className="text-sm text-muted-foreground italic">{review.provider_response}</p>
          </div>
        )}

        {/* Actions row */}
        <div className="mt-3 flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-7 px-2", userVote === true && "bg-green-50 text-green-700 dark:bg-green-900/20")}
              onClick={() => handleVote(true)}
              disabled={votePending || isOwnReview}
              aria-label={`Helpful (${helpfulCount})`}
            >
              <ThumbsUp className="mr-1 size-3.5" />
              <span className="text-xs tabular-nums">{helpfulCount}</span>
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-7 px-2", userVote === false && "bg-red-50 text-red-700 dark:bg-red-900/20")}
              onClick={() => handleVote(false)}
              disabled={votePending || isOwnReview}
              aria-label={`Not helpful (${notHelpfulCount})`}
            >
              <ThumbsDown className="mr-1 size-3.5" />
              <span className="text-xs tabular-nums">{notHelpfulCount}</span>
            </Button>
          </div>

          <div className="ml-auto flex items-center gap-1">
            {canEdit && (
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => onEdit?.(review)}>
                <Pencil className="mr-1 size-3.5" />
                <span className="text-xs">Edit</span>
              </Button>
            )}
            {!isOwnReview && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-muted-foreground hover:text-destructive"
                onClick={() => setReportOpen(true)}
              >
                <Flag className="mr-1 size-3.5" />
                <span className="text-xs">Report</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <ReportReviewModal
        reviewId={review.id}
        open={reportOpen}
        onOpenChange={setReportOpen}
      />
    </>
  );
}
