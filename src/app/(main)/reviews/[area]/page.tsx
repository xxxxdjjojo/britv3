import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReviewAggregateHero } from "@/components/reviews/ReviewAggregateHero";
import { RatingStars } from "@/components/reviews/RatingStars";
import Link from "next/link";

type PageProps = {
  params: Promise<{ area: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { area } = await params;
  return {
    title: `Service Providers in ${area.toUpperCase()} — Reviews`,
    description: `Find verified and reviewed service providers in the ${area.toUpperCase()} area. Read real customer reviews and ratings.`,
  };
}

export default async function AreaReviewsPage({ params }: PageProps) {
  const { area } = await params;
  const areaCode = area.toUpperCase();

  const supabase = await createClient();

  // Fetch area aggregate stats
  const { data: areaStats, error } = await supabase
    .from("area_rating_stats")
    .select("*")
    .eq("area_code", areaCode)
    .order("total_reviews", { ascending: false });

  if (error || !areaStats || areaStats.length === 0) {
    notFound();
  }

  // Compute overall area stats
  const totalReviews = areaStats.reduce((sum, s) => sum + Number(s.total_reviews), 0);
  const totalProviders = areaStats.reduce((sum, s) => sum + Number(s.total_providers), 0);
  const weightedRating =
    areaStats.reduce((sum, s) => sum + Number(s.avg_rating) * Number(s.total_reviews), 0) /
    (totalReviews || 1);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <ReviewAggregateHero
        areaCode={areaCode}
        avgRating={weightedRating}
        totalReviews={totalReviews}
        totalProviders={totalProviders}
      />

      {/* Category breakdown */}
      <section className="mt-8">
        <h2 className="font-heading text-xl font-bold text-foreground">
          By Category
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {areaStats.map((stat) => (
            <Link
              key={`${stat.area_code}-${stat.trade_category}`}
              href={`/reviews/${area}/${stat.trade_category}`}
              className="group rounded-lg border border-border bg-white p-4 transition-shadow hover:shadow-md dark:bg-neutral-900"
            >
              <h3 className="font-medium capitalize text-foreground group-hover:text-brand-primary">
                {stat.trade_category}
              </h3>
              <div className="mt-2 flex items-center gap-2">
                <RatingStars rating={Number(stat.avg_rating)} size="sm" showValue />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {Number(stat.total_reviews).toLocaleString()} reviews from {stat.total_providers} providers
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
