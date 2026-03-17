"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
import { MessageSquare, Star } from "lucide-react";

type Review = {
  id: string;
  rating: number;
  review_text?: string;
  reviewer_name?: string;
  created_at: string;
  agent_response?: string;
  responded_at?: string;
};

type Stats = {
  overall_avg: number;
  total_count: number;
  by_star: Record<number, number>;
};

type Props = Readonly<{ reviews: Review[]; stats: Stats }>;

function StarDisplay({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "text-3xl" : size === "sm" ? "text-sm" : "text-lg";
  return (
    <span className={`${sizeClass} tracking-tight`} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= Math.round(rating) ? "text-yellow-400" : "text-muted-foreground/30"}
        >
          ★
        </span>
      ))}
    </span>
  );
}

export function ReviewsDashboard({ reviews, stats }: Props) {
  const [starFilter, setStarFilter] = useState<string>("all");
  const [responseFilter, setResponseFilter] = useState<string>("all");

  // Sentiment trend: group by month, compute avg rating
  const trendData = useMemo(() => {
    const monthMap: Record<string, { sum: number; count: number }> = {};
    for (const r of reviews) {
      const date = new Date(r.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthMap[key]) monthMap[key] = { sum: 0, count: 0 };
      monthMap[key].sum += r.rating;
      monthMap[key].count += 1;
    }
    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, { sum, count }]) => ({
        month: month.slice(5), // "MM"
        avg: parseFloat((sum / count).toFixed(2)),
      }));
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const starOk = starFilter === "all" || r.rating === parseInt(starFilter, 10);
      const respOk =
        responseFilter === "all" ||
        (responseFilter === "responded" ? !!r.agent_response : !r.agent_response);
      return starOk && respOk;
    });
  }, [reviews, starFilter, responseFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Reviews</h1>
        <p className="text-muted-foreground">Monitor and respond to client feedback</p>
      </div>

      {/* Hero rating */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:gap-6 sm:text-left">
            <div>
              <p className="font-heading text-6xl font-bold tabular-nums">
                {stats.overall_avg.toFixed(1)}
              </p>
              <StarDisplay rating={stats.overall_avg} size="lg" />
              <p className="mt-1 text-sm text-muted-foreground">
                Based on {stats.total_count} review{stats.total_count !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Distribution bars */}
            <div className="flex-1 space-y-1.5 w-full max-w-sm">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats.by_star[star] ?? 0;
                const pct = stats.total_count > 0 ? (count / stats.total_count) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-sm">
                    <span className="w-6 shrink-0 text-right">{star}★</span>
                    <div className="flex-1 rounded-full bg-muted h-2 overflow-hidden">
                      <div
                        className="bg-yellow-400 h-2 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-6 shrink-0 text-muted-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sentiment trend chart */}
      {trendData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Rating Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis domain={[1, 5]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="avg"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Filter controls */}
      <div className="flex flex-wrap gap-3">
        <Select value={starFilter} onValueChange={setStarFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Stars" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stars</SelectItem>
            {[5, 4, 3, 2, 1].map((s) => (
              <SelectItem key={s} value={String(s)}>
                {s} Star{s !== 1 ? "s" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={responseFilter} onValueChange={setResponseFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="responded">Responded</SelectItem>
            <SelectItem value="not_responded">Not Responded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Review list */}
      <div className="space-y-4">
        {filteredReviews.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Star className="mx-auto mb-3 size-8 opacity-30" />
              <p>No reviews match your filters.</p>
            </CardContent>
          </Card>
        )}
        {filteredReviews.map((review) => {
          const truncated =
            review.review_text && review.review_text.length > 150
              ? review.review_text.slice(0, 150) + "…"
              : review.review_text;
          const dateStr = new Date(review.created_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
          return (
            <Card key={review.id}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">
                        {review.reviewer_name ?? "Anonymous"}
                      </p>
                      <StarDisplay rating={review.rating} size="sm" />
                      <span className="text-xs text-muted-foreground">{dateStr}</span>
                      {review.agent_response ? (
                        <Badge variant="secondary">Responded</Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 border-amber-300">
                          Awaiting response
                        </Badge>
                      )}
                    </div>
                    {truncated && (
                      <p className="text-sm text-muted-foreground">{truncated}</p>
                    )}
                    {review.agent_response && (
                      <div className="mt-2 rounded-md bg-muted p-3 text-sm">
                        <p className="font-medium text-xs text-muted-foreground mb-1">
                          Your response
                        </p>
                        <p>{review.agent_response}</p>
                      </div>
                    )}
                  </div>
                  {!review.agent_response && (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/dashboard/agent/reviews/${review.id}/respond`}>
                        <MessageSquare className="mr-1.5 size-3.5" />
                        Respond
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
