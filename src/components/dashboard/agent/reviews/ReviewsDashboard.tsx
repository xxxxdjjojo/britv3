"use client";

import { useState } from "react";
import Link from "next/link";

type ReviewRow = {
  id: string;
  rating: number;
  content: string | null;
  reviewer_id: string | null;
  reviewed_entity_id: string;
  agent_response: string | null;
  responded_at: string | null;
  created_at: string;
  reviewer_name: string | null;
};

function StarIcon(props: Readonly<{ filled: boolean }>) {
  return (
    <svg
      className={`h-5 w-5 ${props.filled ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function StarsRow(props: Readonly<{ rating: number }>) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <StarIcon key={s} filled={s <= Math.round(props.rating)} />
      ))}
    </div>
  );
}

export function ReviewsDashboard(
  props: Readonly<{
    reviews: ReviewRow[];
    avgRating: number;
    total: number;
    distribution: Record<number, number>;
  }>,
) {
  const { reviews, avgRating, total, distribution } = props;
  const [filterStar, setFilterStar] = useState<number | null>(null);

  const filtered =
    filterStar !== null
      ? reviews.filter((r) => Math.round(r.rating) === filterStar)
      : reviews;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Reviews
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your client reviews and respond to feedback.
        </p>
      </div>

      {/* Hero: average rating */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-6">
          <div className="text-5xl font-bold text-gray-900 dark:text-white">
            {total > 0 ? avgRating.toFixed(1) : "--"}
          </div>
          <div>
            <StarsRow rating={avgRating} />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {total} review{total !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Rating distribution */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Rating Distribution
        </h2>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = distribution[star] ?? 0;
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <button
                key={star}
                type="button"
                onClick={() =>
                  setFilterStar(filterStar === star ? null : star)
                }
                className={`flex w-full items-center gap-3 rounded px-2 py-1 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  filterStar === star
                    ? "bg-blue-50 dark:bg-blue-900/30"
                    : ""
                }`}
              >
                <span className="w-12 text-right font-medium text-gray-700 dark:text-gray-300">
                  {star} star
                </span>
                <div className="flex-1 rounded-full bg-gray-200 dark:bg-gray-600">
                  <div
                    className="h-2.5 rounded-full bg-yellow-400"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right text-gray-500 dark:text-gray-400">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        {filterStar !== null && (
          <button
            type="button"
            onClick={() => setFilterStar(null)}
            className="mt-3 text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Reviews list */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {filterStar !== null
            ? `${filterStar}-Star Reviews (${filtered.length})`
            : `Recent Reviews (${filtered.length})`}
        </h2>

        {filtered.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
            <p className="text-gray-500 dark:text-gray-400">
              No reviews found.
            </p>
          </div>
        ) : (
          filtered.map((review) => {
            const truncated =
              review.content && review.content.length > 200
                ? review.content.slice(0, 200) + "..."
                : review.content;

            return (
              <div
                key={review.id}
                className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <StarsRow rating={review.rating} />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {review.reviewer_name ?? "Anonymous"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(review.created_at).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {review.agent_response ? (
                      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Responded
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                        Awaiting Response
                      </span>
                    )}
                  </div>
                </div>

                {truncated && (
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                    {truncated}
                  </p>
                )}

                <div className="mt-4">
                  <Link
                    href={`/dashboard/agent/reviews/${review.id}/respond`}
                    className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {review.agent_response ? "View / Edit Response" : "Respond"}
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
