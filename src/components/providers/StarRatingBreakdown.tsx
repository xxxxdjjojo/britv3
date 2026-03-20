/**
 * StarRatingBreakdown — Server Component
 *
 * Renders a detailed star rating breakdown widget for a provider's public profile.
 * Shows overall average, star distribution bars, and sub-category scores.
 */

import { Star } from "lucide-react";
import type { ProviderRatingStats } from "@/types/providers";

type StarRatingBreakdownProps = Readonly<{
  stats: ProviderRatingStats;
}>;

function FilledStars({ rating }: Readonly<{ rating: number }>) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-5 h-5 ${
            star <= Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "fill-slate-200 dark:fill-slate-600 text-slate-200 dark:text-slate-600"
          }`}
        />
      ))}
    </div>
  );
}

export default function StarRatingBreakdown({ stats }: StarRatingBreakdownProps) {
  const avg = stats.avg_rating ?? 0;
  const total = stats.total_reviews;

  const starCounts: { label: string; count: number }[] = [
    { label: "5★", count: stats.five_star },
    { label: "4★", count: stats.four_star },
    { label: "3★", count: stats.three_star },
    { label: "2★", count: stats.two_star },
    { label: "1★", count: stats.one_star },
  ];

  return (
    <section className="space-y-6">
      {/* Large rating display */}
      <div className="flex items-center gap-4">
        <span className="text-5xl font-bold text-[#1B4D3E] dark:text-emerald-400">{avg.toFixed(1)}</span>
        <div className="space-y-1">
          <FilledStars rating={avg} />
          <p className="text-sm text-slate-500 dark:text-slate-400">({total} reviews)</p>
        </div>
      </div>

      {/* Star distribution bars */}
      <div className="space-y-2">
        {starCounts.map(({ label, count }) => {
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={label} className="flex items-center gap-3">
              <span className="text-sm text-slate-600 dark:text-slate-300 w-6 shrink-0">{label}</span>
              <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1B4D3E] rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-sm text-slate-500 dark:text-slate-400 w-8 text-right shrink-0">{count}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
