"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
          className={`size-4 ${i < rating ? "fill-amber-400 text-amber-400" : "text-neutral-200"}`}
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

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-primary-dark">Reviews</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Manage your client reviews and build your reputation.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="bg-white rounded-xl shadow-sm border border-border p-6 text-center">
          <p className="text-4xl font-black text-neutral-900">{averageRating.toFixed(1)}</p>
          <StarRating rating={Math.round(averageRating)} />
          <p className="mt-1 text-xs text-neutral-500">{reviews.length} reviews</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-border p-6 text-center">
          <p className="text-4xl font-black text-brand-primary">{fiveStarCount}</p>
          <p className="text-sm font-medium text-neutral-600">5-Star Reviews</p>
          <p className="text-xs text-neutral-400">{Math.round((fiveStarCount / reviews.length) * 100)}% of total</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-border p-6 text-center">
          <p className="text-4xl font-black text-neutral-900">
            {reviews.filter((r) => r.responded).length}
          </p>
          <p className="text-sm font-medium text-neutral-600">Responded</p>
          <p className="text-xs text-neutral-400">
            {reviews.filter((r) => !r.responded).length} pending response
          </p>
        </div>
      </div>

      {/* Review List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="bg-white rounded-xl shadow-sm border border-border p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-neutral-900">{review.clientName}</h3>
                  <Badge variant="outline" className="text-[10px]">{review.mortgageType}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <StarRating rating={review.rating} />
                  <span className="text-xs text-neutral-400">
                    {new Date(review.date).toLocaleDateString("en-GB")}
                  </span>
                </div>
              </div>
              {review.responded ? (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
                  <ThumbsUp className="size-3" />
                  Responded
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  Awaiting Response
                </Badge>
              )}
            </div>
            <p className="text-sm text-neutral-600 leading-relaxed">{review.text}</p>
            {!review.responded && (
              <div className="mt-3 pt-3 border-t border-neutral-100">
                <Button variant="outline" size="sm" className="gap-1.5">
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
