"use client";

/**
 * ReviewsTab — Client Component
 *
 * "Invisible Estate" design: surface-container-low review cards (no borders),
 * gold stars, brand-primary pagination, provider response in branded accent block.
 * Paginated list of approved reviews for a tradesperson's public profile.
 */

import { useState, useCallback } from "react";
import { Star, ChevronLeft, ChevronRight, MessageSquareQuote } from "lucide-react";
import type { PublicReview } from "@/types/providers";
import { formatRelativeDate } from "@/lib/utils/date";

const PAGE_SIZE = 10;

function StarRow({ rating }: Readonly<{ rating: number }>) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          aria-hidden="true"
          className={`w-4 h-4 ${
            star <= rating
              ? "fill-brand-secondary text-brand-secondary"
              : "fill-neutral-200 text-neutral-200 dark:fill-neutral-800 dark:text-neutral-800"
          }`}
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
        className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
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
    <div
      className="w-10 h-10 rounded-xl bg-brand-primary/10 dark:bg-brand-primary/30 flex items-center justify-center flex-shrink-0"
      aria-hidden="true"
    >
      <span className="text-sm font-semibold text-brand-primary dark:text-success">
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
    <div className="space-y-5">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-heading tracking-tight text-neutral-950 dark:text-white">
          Reviews
          {total > 0 && (
            <span className="text-base font-normal text-neutral-400 ml-2">({total})</span>
          )}
        </h2>
        <span className="text-xs text-neutral-400 font-medium">Most Recent</span>
      </div>

      {/* Review cards */}
      {reviews.length === 0 && !loading ? (
        <div className="py-16 rounded-2xl bg-surface-container-low dark:bg-neutral-900 text-center">
          <MessageSquareQuote className="w-10 h-10 text-neutral-400 mx-auto mb-3" aria-hidden="true" />
          <p className="text-neutral-500 dark:text-neutral-400 font-medium">No reviews yet</p>
          <p className="text-sm text-neutral-400 mt-1">
            Be the first to review {providerName}
          </p>
        </div>
      ) : (
        <div className={`space-y-3 ${loading ? "opacity-50 pointer-events-none" : ""}`}>
          {reviews.map((review) => (
            <article
              key={review.id}
              className="p-5 rounded-2xl bg-surface-container-low dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-start gap-3">
                  <ReviewerAvatar
                    fullName={review.profiles.full_name}
                    avatarUrl={review.profiles.avatar_url}
                  />
                  <div>
                    <p className="font-semibold text-neutral-950 dark:text-white text-sm">
                      {review.profiles.full_name ?? "Anonymous"}
                    </p>
                    <p className="text-xs text-neutral-400">
                      Verified Customer &bull;{" "}
                      {formatRelativeDate(review.created_at)}
                    </p>
                  </div>
                </div>
                <StarRow rating={review.overall_rating} />
              </div>

              {/* Title */}
              {review.title && (
                <p className="font-semibold text-neutral-950 dark:text-white text-sm mb-1">
                  {review.title}
                </p>
              )}

              {/* Body */}
              {review.body && (
                <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">
                  {review.body}
                </p>
              )}

              {/* Provider response — branded accent block */}
              {review.provider_response && (
                <div className="ml-8 mt-4 p-4 bg-brand-primary/5 dark:bg-brand-primary/15 rounded-xl">
                  <p className="text-xs font-bold text-brand-primary dark:text-success mb-1 flex items-center gap-1.5">
                    <span className="w-1 h-3 bg-brand-primary dark:bg-success rounded-full inline-block" aria-hidden="true" />
                    Response from {providerName}
                  </p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 italic leading-relaxed">
                    {review.provider_response}
                  </p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* Pagination controls */}
      {totalPages > 1 && (
        <nav
          className="flex items-center justify-center gap-1.5 pt-2"
          aria-label="Reviews pagination"
        >
          <button
            type="button"
            onClick={goToPrev}
            disabled={page <= 1 || loading}
            className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-surface-container-low dark:bg-neutral-900 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => {
              if (p === 1 || p === totalPages) return true;
              return Math.abs(p - page) <= 1;
            })
            .reduce<(number | "...")[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                acc.push("...");
              }
              acc.push(p);
              return acc;
            }, [])
            .map((item, idx) =>
              item === "..." ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-11 h-11 flex items-center justify-center text-neutral-400 text-sm"
                  aria-hidden="true"
                >
                  &hellip;
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => fetchPage(item as number)}
                  disabled={loading}
                  aria-label={`Go to page ${item}`}
                  aria-current={page === item ? "page" : undefined}
                  className={`w-11 h-11 rounded-xl text-sm font-medium transition-colors ${
                    page === item
                      ? "bg-brand-primary text-white shadow-sm"
                      : "bg-surface-container-low dark:bg-neutral-900 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800"
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
            className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-surface-container-low dark:bg-neutral-900 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </nav>
      )}

      {/* Review eligibility note */}
      <p className="text-xs text-neutral-400 pt-1">
        Reviews can only be submitted after completing a booking with {providerName}.
      </p>
    </div>
  );
}
