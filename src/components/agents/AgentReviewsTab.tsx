/**
 * AgentReviewsTab — Server Component
 *
 * Renders paginated approved reviews for an estate agent public profile.
 * Identical layout to the tradesperson ReviewsTab with one addition:
 * if a review includes listing context (address + type), a property pill
 * is rendered above the review body.
 */

import { Star, Home } from "lucide-react";
import type { PublicReview } from "@/types/providers";
import { formatRelativeDate } from "@/lib/utils/date";

// AgentPublicReview extends PublicReview with optional property context fields.
// We inline the type here to avoid a circular import — also exported for consumers.
export type AgentPublicReview = PublicReview & {
  listing_address?: string | null;
  listing_type?: "sale" | "let" | null;
};

type AgentReviewsTabProps = Readonly<{
  reviews: AgentPublicReview[];
  total: number;
  agencyName: string;
}>;

function StarRow({ rating }: Readonly<{ rating: number }>) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${star <= rating ? "fill-[#D4A853] text-[#D4A853]" : "fill-[#e8e6e3] text-[#e8e6e3] dark:fill-[#243330] dark:text-[#243330]"}`}
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
    <div className="w-10 h-10 rounded-full bg-[#f4f3f2] dark:bg-[#1a2822] flex items-center justify-center flex-shrink-0">
      <span className="text-sm font-semibold text-[#1a1a1a] dark:text-[#e8e6e3]">
        {initials}
      </span>
    </div>
  );
}

function PropertyContextPill({
  address,
  listingType,
}: Readonly<{ address: string; listingType?: "sale" | "let" | null }>) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#f4f3f2] dark:bg-[#1a2822] rounded text-xs text-[#6b7280] dark:text-[#9ca3af]">
        <Home className="w-3 h-3" />
        {address}
      </span>
      {listingType === "sale" && (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
          Sale
        </span>
      )}
      {listingType === "let" && (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#1B4D3E]/10 text-[#1B4D3E] dark:bg-[#1B4D3E]/20 dark:text-emerald-400">
          Let
        </span>
      )}
    </div>
  );
}

export function AgentReviewsTab({
  reviews,
  total,
  agencyName,
}: AgentReviewsTabProps) {
  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-bold tracking-tight text-[#1a1a1a] dark:text-white">
          Reviews ({total})
        </h2>
        <span className="text-sm text-[#6b7280] dark:text-[#9ca3af] font-medium">
          Sort: Most Recent
        </span>
      </div>

      {/* Review cards */}
      {reviews.length === 0 ? (
        <div className="p-8 rounded-xl bg-[#f4f3f2] dark:bg-[#1a2822] text-center">
          <p className="text-[#6b7280] dark:text-[#9ca3af] text-sm">
            No reviews yet for {agencyName}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="p-6 rounded-xl bg-[#f4f3f2] dark:bg-[#1a2822]"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-start gap-3">
                  <ReviewerAvatar
                    fullName={review.profiles.full_name}
                    avatarUrl={review.profiles.avatar_url}
                  />
                  <div>
                    <p className="font-semibold text-[#1a1a1a] dark:text-white text-sm">
                      {review.profiles.full_name ?? "Anonymous"}
                    </p>
                    <p className="text-xs text-[#6b7280] dark:text-[#9ca3af]">
                      Verified Customer &bull;{" "}
                      {formatRelativeDate(review.created_at)}
                    </p>
                  </div>
                </div>
                <StarRow rating={review.overall_rating} />
              </div>

              {/* Property context pill (agent-specific) */}
              {review.listing_address && (
                <PropertyContextPill
                  address={review.listing_address}
                  listingType={review.listing_type}
                />
              )}

              {/* Title */}
              {review.title && (
                <p className="font-semibold text-[#1a1a1a] dark:text-[#e8e6e3] text-sm mb-1">
                  {review.title}
                </p>
              )}

              {/* Body */}
              {review.body && (
                <p className="text-[#6b7280] dark:text-[#9ca3af] text-sm leading-relaxed">
                  {review.body}
                </p>
              )}

              {/* Agency response */}
              {review.provider_response && (
                <div className="ml-8 mt-4 p-4 bg-[#1B4D3E]/5 dark:bg-[#1B4D3E]/10 rounded-lg border-l-4 border-[#1B4D3E]">
                  <p className="text-xs font-bold text-[#1a1a1a] dark:text-[#e8e6e3] mb-1">
                    Response from {agencyName}:
                  </p>
                  <p className="text-sm text-[#6b7280] dark:text-[#9ca3af] italic leading-relaxed">
                    {review.provider_response}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
