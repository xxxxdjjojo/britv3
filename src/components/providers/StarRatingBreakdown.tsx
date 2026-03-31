/**
 * StarRatingBreakdown — Server Component
 *
 * "Invisible Estate" design: large gold average display, brand-primary progress
 * bars, surface-container-low card wrapper, no borders.
 */

import { Star } from "lucide-react";
import type { ProviderRatingStats } from "@/types/providers";

type StarRatingBreakdownProps = Readonly<{
  stats: ProviderRatingStats;
}>;

function FilledStars({ rating }: Readonly<{ rating: number }>) {
  return (
    <div className="flex gap-0.5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-5 h-5 ${
            star <= Math.round(rating)
              ? "fill-[#D4A853] text-[#D4A853]"
              : "fill-[#e8e6e3] text-[#e8e6e3] dark:fill-[#1a2822] dark:text-[#1a2822]"
          }`}
        />
      ))}
    </div>
  );
}

export default function StarRatingBreakdown({ stats }: StarRatingBreakdownProps) {
  const avg = stats.avg_rating ?? 0;
  const total = stats.total_reviews;

  const starCounts: { label: string; count: number; stars: number }[] = [
    { label: "5 stars", count: stats.five_star, stars: 5 },
    { label: "4 stars", count: stats.four_star, stars: 4 },
    { label: "3 stars", count: stats.three_star, stars: 3 },
    { label: "2 stars", count: stats.two_star, stars: 2 },
    { label: "1 star", count: stats.one_star, stars: 1 },
  ];

  return (
    <section
      className="rounded-2xl bg-[#f4f3f2] dark:bg-[#1a2822] p-6 space-y-5"
      aria-label="Rating breakdown"
    >
      {/* Large rating display */}
      <div className="flex items-center gap-5">
        <div className="text-center">
          <span className="text-5xl font-bold text-[#1B4D3E] dark:text-[#4ade80] font-heading tracking-tight">
            {avg.toFixed(1)}
          </span>
          <p className="text-xs text-[#9ca3af] mt-0.5">out of 5</p>
        </div>
        <div className="space-y-1">
          <FilledStars rating={avg} />
          <p className="text-sm text-[#6b7280] dark:text-[#9ca3af]">
            Based on {total} {total === 1 ? "review" : "reviews"}
          </p>
        </div>
      </div>

      {/* Star distribution bars */}
      <div className="space-y-2.5">
        {starCounts.map(({ label, count, stars }) => {
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={stars} className="flex items-center gap-3">
              <span className="text-xs text-[#6b7280] dark:text-[#9ca3af] w-12 shrink-0 text-right">
                {stars}★
              </span>
              <div
                className="flex-1 h-2 bg-[#e8e6e3] dark:bg-[#243330] rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${label}: ${pct}%`}
              >
                <div
                  className="h-full bg-[#1B4D3E] dark:bg-[#4ade80] rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-[#9ca3af] w-6 text-right shrink-0">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
