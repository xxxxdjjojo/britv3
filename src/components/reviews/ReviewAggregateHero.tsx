import { Users, MapPin } from "lucide-react";
import { RatingStars } from "@/components/reviews/RatingStars";

type ReviewAggregateHeroProps = Readonly<{
  areaCode: string;
  category?: string;
  avgRating: number;
  totalReviews: number;
  totalProviders: number;
}>;

export function ReviewAggregateHero({
  areaCode,
  category,
  avgRating,
  totalReviews,
  totalProviders,
}: ReviewAggregateHeroProps) {
  const title = category
    ? `${category.charAt(0).toUpperCase() + category.slice(1)}s in ${areaCode}`
    : `Service Providers in ${areaCode}`;

  return (
    <div className="rounded-xl border border-border bg-white p-6 shadow-sm dark:bg-neutral-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4" />
            <span>{areaCode} area</span>
          </div>
          <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="font-heading text-4xl font-bold tabular-nums text-foreground">
              {avgRating.toFixed(1)}
            </p>
            <RatingStars rating={avgRating} size="sm" />
            <p className="mt-1 text-xs text-muted-foreground">
              {totalReviews.toLocaleString()} review{totalReviews !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Users className="size-5 text-brand-primary" />
              <span className="font-heading text-2xl font-bold tabular-nums text-foreground">
                {totalProviders}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              verified provider{totalProviders !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
