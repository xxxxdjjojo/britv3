/**
 * ReviewsTab — Server Component
 *
 * Renders a paginated list of approved reviews for a tradesperson's public
 * profile. Displays star ratings, reviewer initials/avatar, relative date,
 * and optional provider response block.
 */

import { Star } from "lucide-react";
import type { PublicReview } from "@/types/providers";

type ReviewsTabProps = Readonly<{
  reviews: PublicReview[];
  total: number;
  providerName: string;
  providerId: string;
}>;

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  const rtf = new Intl.RelativeTimeFormat("en-GB", { numeric: "auto" });

  if (diffYears >= 1) return rtf.format(-diffYears, "year");
  if (diffMonths >= 1) return rtf.format(-diffMonths, "month");
  if (diffWeeks >= 1) return rtf.format(-diffWeeks, "week");
  if (diffDays >= 1) return rtf.format(-diffDays, "day");
  if (diffHours >= 1) return rtf.format(-diffHours, "hour");
  if (diffMinutes >= 1) return rtf.format(-diffMinutes, "minute");
  return "just now";
}

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
    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
      <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
        {initials}
      </span>
    </div>
  );
}

export function ReviewsTab({
  reviews,
  total,
  providerName,
  providerId,
}: ReviewsTabProps) {
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
      {reviews.length === 0 ? (
        <div className="p-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            No reviews yet. Be the first to review {providerName}!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
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
                <div className="ml-8 mt-4 p-4 bg-[#1B4D3E]/5 dark:bg-[#1B4D3E]/10 rounded-lg border-l-4 border-[#1B4D3E]">
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

      {/* Write a Review CTA */}
      <div className="pt-2">
        <a
          href={`/reviews/new?provider=${providerId}`}
          className="text-[#2563EB] font-semibold text-sm hover:underline"
        >
          Write a Review &rarr;
        </a>
      </div>
    </div>
  );
}
