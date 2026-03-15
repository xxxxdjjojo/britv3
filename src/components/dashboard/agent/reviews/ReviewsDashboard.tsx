"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, MessageSquare } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export type AgentReview = Readonly<{
  id: string;
  reviewer_name: string | null;
  rating: number;
  review_text: string | null;
  agent_response: string | null;
  responded_at: string | null;
  created_at: string;
}>;

export type MonthlyRating = Readonly<{
  month: string;
  avg_rating: number;
}>;

export type ReviewsDashboardProps = Readonly<{
  reviews: AgentReview[];
  monthlyTrend: MonthlyRating[];
}>;

// ============================================================================
// Helpers
// ============================================================================

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StarRating({ rating, size = 16 }: Readonly<{ rating: number; size?: number }>) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
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
// ReviewsDashboard component
// ============================================================================

export function ReviewsDashboard({ reviews, monthlyTrend }: ReviewsDashboardProps) {
  const [starFilter, setStarFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Aggregate stats
  const totalCount = reviews.length;
  const avgRating =
    totalCount > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalCount
      : 0;

  const ratingCounts = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      counts[r.rating] = (counts[r.rating] ?? 0) + 1;
    });
    return counts;
  }, [reviews]);

  const distributionData = [5, 4, 3, 2, 1].map((star) => ({
    star: `${star}★`,
    count: ratingCounts[star] ?? 0,
  }));

  // Filter reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (starFilter !== "all" && r.rating !== parseInt(starFilter, 10)) return false;
      if (statusFilter === "responded" && !r.agent_response) return false;
      if (statusFilter === "unresponded" && r.agent_response) return false;
      return true;
    });
  }, [reviews, starFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Hero: Overall rating */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-2 py-8">
          <p className="text-6xl font-bold text-gray-900 dark:text-gray-100">
            {avgRating > 0 ? avgRating.toFixed(1) : "—"}
          </p>
          <StarRating rating={Math.round(avgRating)} size={24} />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Based on {totalCount} {totalCount === 1 ? "review" : "reviews"}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Rating distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={distributionData} layout="vertical" margin={{ left: 0, right: 16 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="star" width={32} tick={{ fontSize: 13 }} />
                <Tooltip
                  formatter={(value: number) => [`${value} reviews`, "Count"]}
                  contentStyle={{ fontSize: 12 }}
                />
                <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sentiment trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rating Trend (12 months)</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyTrend.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">Not enough data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={monthlyTrend} margin={{ left: -16, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis domain={[1, 5]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: number) => [value.toFixed(1), "Avg rating"]}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avg_rating"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters + review list */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Reviews</CardTitle>
            <div className="flex gap-2">
              <Select value={starFilter} onValueChange={(v) => setStarFilter(v ?? "all")}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="All stars" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stars</SelectItem>
                  {[5, 4, 3, 2, 1].map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      {s} star{s !== 1 ? "s" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All reviews" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All reviews</SelectItem>
                  <SelectItem value="responded">Responded</SelectItem>
                  <SelectItem value="unresponded">Not responded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
          {filteredReviews.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No reviews match your filters.</p>
          ) : (
            filteredReviews.map((review) => (
              <div key={review.id} className="flex flex-col gap-2 py-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {review.reviewer_name ?? "Anonymous"}
                    </p>
                    <StarRating rating={review.rating} size={14} />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className="text-xs text-gray-400">{formatDate(review.created_at)}</p>
                    {review.agent_response ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                        Responded
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Not responded
                      </Badge>
                    )}
                  </div>
                </div>
                {review.review_text && (
                  <p className="line-clamp-3 text-sm text-gray-700 dark:text-gray-300">
                    {review.review_text}
                  </p>
                )}
                {!review.agent_response && (
                  <Link href={`/dashboard/agent/reviews/${review.id}/respond`}>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <MessageSquare size={14} />
                      Respond
                    </Button>
                  </Link>
                )}
                {review.agent_response && (
                  <div className="rounded-md bg-blue-50 px-3 py-2 dark:bg-blue-950">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">
                      Your response
                    </p>
                    <p className="text-sm text-blue-900 dark:text-blue-100 line-clamp-2">
                      {review.agent_response}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
