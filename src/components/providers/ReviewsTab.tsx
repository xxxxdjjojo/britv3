"use client";

/**
 * ReviewsTab — Client Component
 *
 * Renders a paginated list of approved reviews for a tradesperson's public
 * profile. Displays star ratings, reviewer initials/avatar, relative date,
 * optional provider response, and pagination controls (10 per page).
 */

import { useState, useCallback } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import type { PublicReview } from "@/types/providers";
import { formatRelativeDate } from "@/lib/utils/date";

const PAGE_SIZE = 10;

function StarRow({ rating }: Readonly<{ rating: number }>) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${star <= rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700"}`}
        />
      ))}
    </div>
  );
}

function ReviewerAvatar({
  fullName,
  avatarUrl,
}: Readonly<{ fullName: string | null; avatarUrl: string | null }>) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={fullName ?? "Reviewer"}
        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
      />
    );
  }

  const initials = fullName
    ? fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div className="w-10 h-10 rounded-full bg-muted dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
      <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
        {initials}
      </span>
    </div>
  );
}

type ReviewsTabProps = Readonly<{
  reviews: PublicReview[];
  total: number;
  providerName: string;
  providerId: string;
}>;

export function ReviewsTab({
  reviews: initialReviews,
  total: initialTotal,
  providerName,
  providerId,
}: ReviewsTabProps) {
  const [reviews, setReviews] = useState<PublicReview[]>(initialReviews);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchPage = useCallback(
    async (targetPage: number) => {
      setLoading(true);
      try {
        const offset = (targetPage - 1) * PAGE_SIZE;
        const res = await fetch(
          `/api/reviews/list?provider_id=${providerId}&limit=${PAGE_SIZE}&offset=${offset}&sort=recent`,
        );
        if (res.ok) {
          const json = await res.json();
          setReviews(json.data ?? []);
          setTotal(json.meta?.total ?? total);
          setPage(targetPage);
        }
      } catch {
        // Keep current reviews on error
      } finally {
        setLoading(false);
      }
    },
    [providerId, total],
  );

  const goToPrev = useCallback(() => {
    if (page > 1) fetchPage(page - 1);
  }, [page, fetchPage]);

  const goToNext = useCallback(() => {
    if (page < totalPages) fetchPage(page + 1);
  }, [page, totalPages, fetchPage]);

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Reviews ({total})
        </h2>
        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Sort: Most Recent
        </span>
      </div>

      {/* Review cards */}
      {reviews.length === 0 && !loading ? (
        <div className="p-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            No reviews yet. Be the first to review {providerName}!
          </p>
        </div>
      ) : (
        <div className={`space-y-4 ${loading ? "opacity-50 pointer-events-none" : ""}`}>
          {reviews.map((review) => (
            <div
              key={review.id}
              className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-start gap-3">
                  <ReviewerAvatar
                    fullName={review.profiles.full_name}
                    avatarUrl={review.profiles.avatar_url}
                  />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">
                      {review.profiles.full_name ?? "Anonymous"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Verified Customer &bull;{" "}
                      {formatRelativeDate(review.created_at)}
                    </p>
                  </div>
                </div>
                <StarRow rating={review.overall_rating} />
              </div>

              {/* Title */}
              {review.title && (
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-1">
                  {review.title}
                </p>
              )}

              {/* Body */}
              {review.body && (
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  {review.body}
                </p>
              )}

              {/* Provider response */}
              {review.provider_response && (
                <div className="ml-8 mt-4 p-4 bg-brand-primary/5 dark:bg-brand-primary/10 rounded-lg border-l-4 border-brand-primary">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Response from {providerName}:
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 italic leading-relaxed">
                    {review.provider_response}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={goToPrev}
            disabled={page <= 1 || loading}
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-surface dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page numbers */}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => {
              // Show first, last, and pages near current
              if (p === 1 || p === totalPages) return true;
              return Math.abs(p - page) <= 1;
            })
            .reduce<(number | "...")[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1]) > 1) {
                acc.push("...");
              }
              acc.push(p);
              return acc;
            }, [])
            .map((item, idx) =>
              item === "..." ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-10 h-10 flex items-center justify-center text-slate-400 text-sm"
                >
                  ...
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => fetchPage(item as number)}
                  disabled={loading}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                    page === item
                      ? "bg-brand-primary text-white"
                      : "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-surface dark:hover:bg-slate-800"
                  }`}
                >
                  {item}
                </button>
              ),
            )}

          <button
            type="button"
            onClick={goToNext}
            disabled={page >= totalPages || loading}
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-surface dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Review eligibility note */}
      <div className="pt-2">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Reviews can be submitted after completing a booking with {providerName}.
        </p>
      </div>
    </div>
  );
}
