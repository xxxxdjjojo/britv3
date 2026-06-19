import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReviewAggregateHero } from "@/components/reviews/ReviewAggregateHero";
import { RatingStars } from "@/components/reviews/RatingStars";
import Link from "next/link";
import type { Metadata } from "next";

type PageProps = {
  params: Promise<{ area: string; category: string }>;
  searchParams: Promise<{ min_rating?: string; sort?: string }>;
};

function formatCategoryTitle(category: string): string {
  return category
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { area, category } = await params;
  const areaCode = area.toUpperCase();
  const categoryTitle = formatCategoryTitle(category);

  return {
    title: `${categoryTitle} Reviews in ${areaCode} | TrueDeed`,
    description: `Find top rated ${categoryTitle.toLowerCase()} in ${areaCode} with verified customer reviews and ratings.`,
  };
}

export default async function CategoryReviewsPage({
  params,
  searchParams,
}: PageProps) {
  const { area, category } = await params;
  const { min_rating, sort } = await searchParams;
  const areaCode = area.toUpperCase();
  const categoryTitle = formatCategoryTitle(category);

  const supabase = await createClient();

  // Fetch category aggregate stats for this area
  const { data: categoryStats, error: statsError } = await supabase
    .from("area_rating_stats")
    .select("*")
    .eq("area_code", areaCode)
    .eq("trade_category", category)
    .single();

  if (statsError || !categoryStats) {
    notFound();
  }

  // Fetch providers in this area + category
  let providersQuery = supabase
    .from("service_provider_details")
    .select(
      `
      id,
      business_name,
      slug,
      city,
      services,
      years_in_business,
      completed_jobs_count,
      provider_rating_stats (
        average_rating,
        total_reviews
      )
    `,
    )
    .contains("services", [category])
    .overlaps("service_postcodes", [areaCode]);

  // Apply minimum rating filter if provided
  const minRating = min_rating ? parseFloat(min_rating) : null;

  // Sort order
  const sortBy = sort === "reviews" ? "completed_jobs_count" : "completed_jobs_count";
  providersQuery = providersQuery.order(sortBy, { ascending: false });

  const { data: providersData, error: providersError } = await providersQuery;

  if (providersError) {
    notFound();
  }

  // Map and filter providers with rating stats
  const providers = (providersData ?? [])
    .map((p) => {
      const stats = Array.isArray(p.provider_rating_stats)
        ? p.provider_rating_stats[0]
        : p.provider_rating_stats;
      return {
        ...p,
        avgRating: stats ? Number(stats.average_rating) : 0,
        reviewCount: stats ? Number(stats.total_reviews) : 0,
      };
    })
    .filter((p) => (minRating ? p.avgRating >= minRating : true))
    .sort((a, b) =>
      sort === "reviews"
        ? b.reviewCount - a.reviewCount
        : b.avgRating - a.avgRating || b.reviewCount - a.reviewCount,
    );

  const avgRating = Number(categoryStats.avg_rating);
  const totalReviews = Number(categoryStats.total_reviews);
  const totalProviders = Number(categoryStats.total_providers);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": `${categoryTitle} in ${areaCode}`,
            "description": `Top rated ${categoryTitle.toLowerCase()} in ${areaCode} with verified reviews`,
            "numberOfItems": providers.length,
          }),
        }}
      />

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <li>
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href={`/reviews/${area}`}
              className="hover:text-foreground transition-colors"
            >
              Reviews in {areaCode}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li
            className="font-medium text-foreground"
            aria-current="page"
          >
            {categoryTitle}
          </li>
        </ol>
      </nav>

      {/* Hero with aggregate stats */}
      <ReviewAggregateHero
        areaCode={areaCode}
        category={category}
        avgRating={avgRating}
        totalReviews={totalReviews}
        totalProviders={totalProviders}
      />

      {/* Provider cards */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold text-foreground">
            {categoryTitle} Providers
          </h2>
          <div className="flex items-center gap-2">
            {minRating && (
              <Link
                href={`/reviews/${area}/category/${category}`}
                className="text-xs text-brand-primary hover:underline"
              >
                Clear filter
              </Link>
            )}
            <select
              className="rounded-md border border-input bg-transparent px-2 py-1 text-xs text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/50"
              defaultValue={sort ?? "rating"}
              // Sort is handled server-side via searchParams
              // Using a form for progressive enhancement
            >
              <option value="rating">Highest rated</option>
              <option value="reviews">Most reviews</option>
            </select>
          </div>
        </div>

        {providers.length === 0 ? (
          <div className="mt-6 rounded-lg border border-border bg-white p-8 text-center dark:bg-neutral-900">
            <p className="text-sm text-muted-foreground">
              No {categoryTitle.toLowerCase()} found in {areaCode}
              {minRating ? ` with a minimum rating of ${minRating}` : ""}.
            </p>
            {minRating && (
              <Link
                href={`/reviews/${area}/category/${category}`}
                className="mt-2 inline-block text-sm text-brand-primary hover:underline"
              >
                Remove rating filter
              </Link>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {providers.map((provider) => (
              <Link
                key={provider.id}
                href={`/reviews/${area}/${provider.slug}`}
                className="group block rounded-lg border border-border bg-white p-4 transition-shadow hover:shadow-md dark:bg-neutral-900"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-foreground group-hover:text-brand-primary">
                      {provider.business_name}
                    </h3>
                    {provider.city && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {provider.city}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <RatingStars
                      rating={provider.avgRating}
                      size="sm"
                      showValue
                    />
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {provider.reviewCount.toLocaleString()}{" "}
                      {provider.reviewCount === 1 ? "review" : "reviews"}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  {provider.years_in_business > 0 && (
                    <span>
                      {provider.years_in_business}{" "}
                      {provider.years_in_business === 1 ? "year" : "years"} in business
                    </span>
                  )}
                  {provider.completed_jobs_count > 0 && (
                    <span>
                      {provider.completed_jobs_count.toLocaleString()} jobs completed
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Link back to area overview */}
      <div className="mt-8 border-t border-border pt-6">
        <Link
          href={`/reviews/${area}`}
          className="text-sm text-brand-primary hover:underline"
        >
          &larr; Back to all providers in {areaCode}
        </Link>
      </div>
    </div>
  );
}
