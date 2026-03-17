import Link from "next/link";
import { Star, MessageSquarePlus } from "lucide-react";

export type ReviewRow = {
  id: string;
  reviewer_name: string;
  created_at: string;
  overall_rating: number;
  comment: string | null;
  provider_response: string | null;
};

type ReviewCardProps = Readonly<{
  review: ReviewRow;
}>;

function StarRating({ rating }: Readonly<{ rating: number }>) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`size-4 ${
            n <= rating
              ? "fill-amber-400 text-amber-400"
              : "fill-neutral-200 text-neutral-200"
          }`}
        />
      ))}
    </div>
  );
}

export function ReviewCard({ review }: ReviewCardProps) {
  const date = new Date(review.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-neutral-900">
            {review.reviewer_name}
          </p>
          <p className="mt-0.5 text-xs text-neutral-400">{date}</p>
        </div>
        <StarRating rating={review.overall_rating} />
      </div>

      {/* Comment */}
      {review.comment && (
        <p className="mt-3 text-sm leading-relaxed text-neutral-600">
          {review.comment}
        </p>
      )}

      {/* Provider response — or reply CTA */}
      {review.provider_response ? (
        <div className="mt-4 rounded-lg bg-neutral-50 px-4 py-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Your response
          </p>
          <p className="text-sm leading-relaxed text-neutral-700">
            {review.provider_response}
          </p>
        </div>
      ) : (
        <div className="mt-4">
          <Link
            href={`/dashboard/provider/reviews/${review.id}/respond`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1B4D3E] hover:underline"
          >
            <MessageSquarePlus className="size-3.5" />
            Reply to this review
          </Link>
        </div>
      )}
    </div>
  );
}
