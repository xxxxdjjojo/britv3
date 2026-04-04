"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Star, MessageSquare, ThumbsUp } from "lucide-react";

type Review = {
  id: string;
  clientName: string;
  rating: number;
  date: string;
  text: string;
  mortgageType: string;
  responded: boolean;
};

const MOCK_REVIEWS: Review[] = [
  {
    id: "1",
    clientName: "David Collins",
    rating: 5,
    date: "2026-03-15",
    text: "Absolutely fantastic service from start to finish. Alex found us a brilliant rate and guided us through every step of the remortgage process. Couldn't recommend more highly.",
    mortgageType: "Remortgage",
    responded: true,
  },
  {
    id: "2",
    clientName: "Emma Wilson",
    rating: 5,
    date: "2026-03-10",
    text: "As a first-time buyer I was really nervous about the whole process. Alex made everything so clear and straightforward. Got an amazing rate too!",
    mortgageType: "First-time buyer",
    responded: false,
  },
  {
    id: "3",
    clientName: "Priya Patel",
    rating: 4,
    date: "2026-02-28",
    text: "Good service overall. Found a competitive buy-to-let mortgage quickly. Would have liked more frequent updates during the underwriting stage.",
    mortgageType: "Buy-to-let",
    responded: true,
  },
  {
    id: "4",
    clientName: "James Reed",
    rating: 5,
    date: "2026-02-15",
    text: "Excellent broker. Very knowledgeable about the market and got us a deal we couldn't find elsewhere. The whole process was smooth and stress-free.",
    mortgageType: "First-time buyer",
    responded: false,
  },
  {
    id: "5",
    clientName: "Sarah Chen",
    rating: 4,
    date: "2026-01-20",
    text: "Professional and efficient service. Helped us navigate the complexities of self-employed mortgage applications. Very grateful for the expertise.",
    mortgageType: "Remortgage",
    responded: true,
  },
];

function StarRating({ rating }: Readonly<{ rating: number }>) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`size-4 ${i < rating ? "fill-brand-secondary text-brand-secondary" : "text-neutral-200 dark:text-neutral-600"}`}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews] = useState<Review[]>(MOCK_REVIEWS);

  const averageRating =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const fiveStarCount = reviews.filter((r) => r.rating === 5).length;
  const fourStarCount = reviews.filter((r) => r.rating === 4).length;

  void fourStarCount;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="font-heading text-xl font-semibold text-foreground">Reviews</h1>
        <p className="mt-1 font-body text-sm text-neutral-500">
          Manage your client reviews and build your reputation.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-card shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60 p-6 text-center">
          <p className="text-4xl font-black text-foreground">{averageRating.toFixed(1)}</p>
          <StarRating rating={Math.round(averageRating)} />
          <p className="mt-1 font-body text-xs text-neutral-500">{reviews.length} reviews</p>
        </div>
        <div className="rounded-xl bg-card shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60 p-6 text-center">
          <p className="text-4xl font-black text-brand-primary">{fiveStarCount}</p>
          <p className="font-body text-sm font-medium text-foreground">5-Star Reviews</p>
          <p className="font-body text-xs text-neutral-500">{Math.round((fiveStarCount / reviews.length) * 100)}% of total</p>
        </div>
        <div className="rounded-xl bg-card shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60 p-6 text-center">
          <p className="text-4xl font-black text-foreground">
            {reviews.filter((r) => r.responded).length}
          </p>
          <p className="font-body text-sm font-medium text-foreground">Responded</p>
          <p className="font-body text-xs text-neutral-500">
            {reviews.filter((r) => !r.responded).length} pending response
          </p>
        </div>
      </div>

      {/* Review List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="rounded-xl bg-card shadow-sm ring-1 ring-neutral-200/60 dark:ring-neutral-700/60 p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-body text-sm font-semibold text-foreground">{review.clientName}</h3>
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 font-body text-xs font-medium bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                    {review.mortgageType}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <StarRating rating={review.rating} />
                  <span className="font-body text-xs text-neutral-500">
                    {new Date(review.date).toLocaleDateString("en-GB")}
                  </span>
                </div>
              </div>
              {review.responded ? (
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 font-body text-xs font-medium bg-success-light text-success dark:bg-success/20 dark:text-success gap-1">
                  <ThumbsUp className="size-3" />
                  Responded
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 font-body text-xs font-medium bg-warning-light text-warning dark:bg-warning/20 dark:text-warning">
                  Awaiting Response
                </span>
              )}
            </div>
            <p className="font-body text-sm text-foreground leading-relaxed">{review.text}</p>
            {!review.responded && (
              <div className="mt-3 pt-3 border-t border-neutral-100/60 dark:border-neutral-700/60">
                <Button variant="outline" size="sm" className="rounded-lg border border-neutral-200/60 dark:border-neutral-700/60 px-4 py-2 font-body text-sm font-medium text-foreground hover:bg-muted transition-colors gap-1.5">
                  <MessageSquare className="size-3.5" />
                  Write Response
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
