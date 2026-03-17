import { Star } from "lucide-react";

type ReviewsBreakdownProps = Readonly<{
  totalCount: number;
  averageRating: number;
  countPerStar: Record<1 | 2 | 3 | 4 | 5, number>;
}>;

function StarIcon({ filled }: Readonly<{ filled: boolean }>) {
  return (
    <Star
      className={`size-5 ${filled ? "fill-amber-400 text-amber-400" : "fill-neutral-200 text-neutral-200"}`}
    />
  );
}

export function ReviewsBreakdown({
  totalCount,
  averageRating,
  countPerStar,
}: ReviewsBreakdownProps) {
  const levels = [5, 4, 3, 2, 1] as const;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-10">
        {/* Left: large average + stars */}
        <div className="flex flex-col items-center gap-2 sm:min-w-[120px]">
          <span className="text-6xl font-bold text-neutral-900">
            {averageRating.toFixed(1)}
          </span>
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <StarIcon key={n} filled={n <= Math.round(averageRating)} />
            ))}
          </div>
          <p className="text-center text-xs text-neutral-500">
            Based on {totalCount} {totalCount === 1 ? "review" : "reviews"}
          </p>
        </div>

        {/* Right: bar chart per star level */}
        <div className="flex-1 space-y-2">
          {levels.map((star) => {
            const count = countPerStar[star];
            const pct = totalCount > 0 ? (count / totalCount) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-3">
                <span className="w-4 text-right text-xs font-medium text-neutral-700">
                  {star}
                </span>
                <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" />
                {/* Track */}
                <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-neutral-100">
                  {/* Filled bar */}
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-[#1B4D3E] transition-[width] duration-500"
                    style={{ width: `${pct}%` }}
                    role="progressbar"
                    aria-valuenow={Math.round(pct)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${star} star — ${Math.round(pct)}%`}
                  />
                </div>
                <span className="w-7 text-right text-xs text-neutral-500">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
