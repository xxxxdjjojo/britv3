
import { cn } from "@/lib/utils";

type RatingDistributionProps = Readonly<{
  counts: {
    count_5_star: number;
    count_4_star: number;
    count_3_star: number;
    count_2_star: number;
    count_1_star: number;
  };
  className?: string;
}>;

const labels = [
  { key: "count_5_star", label: "5" },
  { key: "count_4_star", label: "4" },
  { key: "count_3_star", label: "3" },
  { key: "count_2_star", label: "2" },
  { key: "count_1_star", label: "1" },
] as const;

export function RatingDistribution({
  counts,
  className,
}: RatingDistributionProps) {
  const maxCount = Math.max(
    counts.count_5_star,
    counts.count_4_star,
    counts.count_3_star,
    counts.count_2_star,
    counts.count_1_star,
    1,
  );

  return (
    <div className={cn("space-y-1.5", className)}>
      {labels.map(({ key, label }) => {
        const count = counts[key];
        const widthPercent = (count / maxCount) * 100;
        return (
          <div key={key} className="flex items-center gap-2 text-sm">
            <span className="w-4 text-right font-medium text-muted-foreground">
              {label}
            </span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
              <div
                className="h-full rounded-full bg-brand-secondary transition-all"
                style={{ width: `${widthPercent}%` }}
              />
            </div>
            <span className="w-8 text-right text-xs text-muted-foreground">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
