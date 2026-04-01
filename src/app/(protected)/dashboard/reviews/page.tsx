"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Star, MessageSquare } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RatingStars } from "@/components/reviews/RatingStars";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { Badge } from "@/components/ui/badge";
import type { Review, ModerationStatus } from "@/types/marketplace";

const MODERATION_COLORS: Record<ModerationStatus, string> = {
  pending: "bg-brand-secondary-light text-[--color-brand-secondary-dark]",
  approved: "bg-brand-primary-lighter text-brand-primary",
  rejected: "bg-error/10 text-error",
  flagged: "bg-warning/10 text-warning",
};

export default function ReviewsPage() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("booking");
  const providerId = searchParams.get("provider");

  const [writtenReviews, setWrittenReviews] = useState<Review[]>([]);
  const [receivedReviews, setReceivedReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState(
    bookingId ? "write" : "written",
  );
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    try {
      const [writtenRes, receivedRes] = await Promise.all([
        fetch("/api/reviews/list?type=written"),
        fetch("/api/reviews/list?type=received"),
      ]);

      if (writtenRes.ok) {
        const data = await writtenRes.json();
        setWrittenReviews(data.reviews ?? data.data ?? []);
      }
      if (receivedRes.ok) {
        const data = await receivedRes.json();
        setReceivedReviews(data.reviews ?? data.data ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  function renderReviewCard(review: Review) {
    return (
      <div
        key={review.id}
        className="rounded-lg border border-border p-4 space-y-2"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium">{review.title}</p>
            <RatingStars rating={review.overall_rating} size="sm" showValue />
          </div>
          <Badge
            variant="outline"
            className={`border-transparent text-xs ${MODERATION_COLORS[review.moderation_status]}`}
          >
            {review.moderation_status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {review.review_text}
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>
            {new Date(review.created_at).toLocaleDateString("en-GB")}
          </span>
          {review.helpful_count > 0 && (
            <span>{review.helpful_count} found helpful</span>
          )}
        </div>
        {review.provider_response && (
          <div className="mt-2 rounded-lg bg-muted/50 p-3">
            <p className="text-xs font-medium text-muted-foreground">
              Provider Response:
            </p>
            <p className="text-sm">{review.provider_response}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Reviews</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {bookingId && providerId && (
            <TabsTrigger value="write">
              <Star className="mr-1 size-3.5" />
              Write Review
            </TabsTrigger>
          )}
          <TabsTrigger value="written">
            <MessageSquare className="mr-1 size-3.5" />
            Written ({writtenReviews.length})
          </TabsTrigger>
          <TabsTrigger value="received">
            <Star className="mr-1 size-3.5" />
            Received ({receivedReviews.length})
          </TabsTrigger>
        </TabsList>

        {/* Write Review Tab */}
        {bookingId && providerId && (
          <TabsContent value="write">
            <Card>
              <CardHeader>
                <CardTitle>Write a Review</CardTitle>
              </CardHeader>
              <CardContent>
                <ReviewForm
                  bookingId={bookingId}
                  providerId={providerId}
                  onSuccess={() => {
                    fetchReviews();
                    setActiveTab("written");
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Written Reviews Tab */}
        <TabsContent value="written">
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : writtenReviews.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-8">
                <MessageSquare className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  You haven&apos;t written any reviews yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {writtenReviews.map(renderReviewCard)}
            </div>
          )}
        </TabsContent>

        {/* Received Reviews Tab */}
        <TabsContent value="received">
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : receivedReviews.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-8">
                <Star className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No reviews received yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {receivedReviews.map(renderReviewCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
