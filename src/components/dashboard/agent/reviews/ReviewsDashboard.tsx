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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare, Star as StarIcon } from "lucide-react";

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

function StarDisplay({
  rating,
  size = "md",
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "lg" ? "size-7" : size === "sm" ? "size-3.5" : "size-5";
  return (
    <span
      className="inline-flex gap-0.5"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon
          key={star}
          className={`${sizeClass} ${
            star <= Math.round(rating)
              ? "text-brand-secondary fill-brand-secondary"
              : "text-neutral-200"
          }`}
          strokeWidth={1.25}
        />
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
      const starOk =
        starFilter === "all" || r.rating === parseInt(starFilter, 10);
      const respOk =
        responseFilter === "all" ||
        (responseFilter === "responded"
          ? !!r.agent_response
          : !r.agent_response);
      return starOk && respOk;
    });
  }, [reviews, starFilter, responseFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Reviews
        </h1>
        <p className="mt-0.5 text-sm text-neutral-500">
          Monitor and respond to client feedback
        </p>
      </div>

      {/* Hero rating card */}
      <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/60">
        <div className="bg-brand-primary px-6 py-5">
          <p className="text-sm font-medium text-white/70">Overall Rating</p>
        </div>
        <div className="p-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-8 sm:items-start">
            <div className="text-center sm:text-left">
              <p className="font-heading text-6xl font-bold tabular-nums text-foreground">
                {stats.overall_avg.toFixed(1)}
              </p>
              <StarDisplay rating={stats.overall_avg} size="lg" />
              <p className="mt-1.5 text-sm text-neutral-500">
                Based on {stats.total_count} review
                {stats.total_count !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Distribution bars */}
            <div className="flex-1 w-full max-w-xs space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats.by_star[star] ?? 0;
                const pct =
                  stats.total_count > 0
                    ? (count / stats.total_count) * 100
                    : 0;
                return (
                  <div key={star} className="flex items-center gap-2.5 text-sm">
                    <span className="w-5 shrink-0 text-right text-xs font-medium text-neutral-400">
                      {star}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className="h-2 rounded-full bg-brand-secondary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-5 shrink-0 text-xs text-neutral-400">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Sentiment trend chart */}
      {trendData.length > 1 && (
        <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/60">
          <div className="bg-neutral-50 px-5 py-4">
            <p className="font-heading font-semibold text-foreground">Rating Trend</p>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-neutral-100)" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "var(--color-neutral-500)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[1, 5]}
                  tick={{ fontSize: 11, fill: "var(--color-neutral-500)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="avg"
                  stroke="var(--color-brand-secondary)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "var(--color-brand-secondary)" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filter controls */}
      <div className="flex flex-wrap gap-3">
        <Select
          value={starFilter}
          onValueChange={(v) => setStarFilter(v ?? "")}
        >
          <SelectTrigger className="w-40 rounded-lg bg-neutral-50">
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

        <Select
          value={responseFilter}
          onValueChange={(v) => setResponseFilter(v ?? "")}
        >
          <SelectTrigger className="w-48 rounded-lg bg-neutral-50">
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
          <div className="flex flex-col items-center justify-center rounded-2xl bg-neutral-50 py-16 text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-brand-primary-lighter">
              <StarIcon className="size-7 text-brand-primary" strokeWidth={1.25} />
            </div>
            <p className="font-heading font-semibold text-foreground">No reviews found</p>
            <p className="mt-1 text-sm text-neutral-500">
              No reviews match your current filters.
            </p>
          </div>
        )}
        {filteredReviews.map((review) => {
          const truncated =
            review.review_text && review.review_text.length > 150
              ? review.review_text.slice(0, 150) + "…"
              : review.review_text;
          const dateStr = new Date(review.created_at).toLocaleDateString(
            "en-GB",
            {
              day: "numeric",
              month: "short",
              year: "numeric",
            },
          );
          return (
            <div
              key={review.id}
              className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border/60 transition-shadow hover:shadow-md"
            >
              <div className="bg-neutral-50 px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">
                        {review.reviewer_name ?? "Anonymous"}
                      </p>
                      <StarDisplay rating={review.rating} size="sm" />
                      <span className="text-xs text-neutral-400">{dateStr}</span>
                      {review.agent_response ? (
                        <span className="inline-flex rounded-full bg-success-light px-2.5 py-0.5 text-[10px] font-semibold text-success">
                          Responded
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-warning-light px-2.5 py-0.5 text-[10px] font-semibold text-warning">
                          Awaiting response
                        </span>
                      )}
                    </div>
                  </div>
                  {!review.agent_response && (
                    <Button
                      asChild
                      size="sm"
                      className="shrink-0 rounded-xl bg-brand-primary text-white hover:bg-brand-primary/90"
                    >
                      <Link
                        href={`/dashboard/agent/reviews/${review.id}/respond`}
                      >
                        <MessageSquare className="mr-1.5 size-3.5" strokeWidth={1.25} />
                        Respond
                      </Link>
                    </Button>
                  )}
                </div>
              </div>

              {(truncated || review.agent_response) && (
                <div className="px-5 py-4 space-y-3">
                  {truncated && (
                    <p className="text-sm leading-relaxed text-neutral-700">
                      {truncated}
                    </p>
                  )}
                  {review.agent_response && (
                    <div className="rounded-xl bg-brand-primary-lighter p-3">
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-brand-primary">
                        Your response
                      </p>
                      <p className="text-sm text-neutral-700">
                        {review.agent_response}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
