import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ReviewAggregateHero } from "@/components/reviews/ReviewAggregateHero";
import { ReviewsList } from "@/components/reviews/ReviewsList";
import type { Review } from "@/types/marketplace";
import type { PublicReview } from "@/types/providers";

type PageProps = {
  params: Promise<{ area: string; provider: string }>;
};

/**
 * Raw row shape returned by the reviews table query.
 * The DB column is review_text; PublicReview.body is a type alias mismatch.
 */
type RawReviewRow = Omit<PublicReview, "body"> & {
  review_text: string;
};

/** Map a raw reviews row to the Review shape ReviewsList expects. */
function toReview(r: RawReviewRow): Review {
  return {
    id: r.id,
    booking_id: null,
    provider_id: r.provider_id,
    reviewer_id: r.reviewer_id,
    overall_rating: r.overall_rating,
    punctuality_rating: null,
    quality_rating: r.quality_rating ?? null,
    value_rating: r.value_rating ?? null,
    professionalism_rating: null,
    title: r.title ?? "",
    review_text: r.review_text ?? "",
    search_vector: null,
    sentiment: null,
    authenticity_score: 1,
    fake_review_probability: 0,
    spam_indicators: {},
    moderation_status: r.moderation_status,
    provider_response: r.provider_response ?? null,
    provider_response_at: r.provider_response_at
      ? new Date(r.provider_response_at)
      : null,
    helpful_count: 0,
    not_helpful_count: 0,
    edited_at: null,
    original_text: null,
    edit_count: 0,
    is_incentivised: false,
    edit_history: [],
    verification_type: "booking",
    verification_source_id: null,
    verification_status: "verified",
    verified_at: new Date(r.created_at),
    created_at: new Date(r.created_at),
    updated_at: new Date(r.created_at),
    deleted_at: r.deleted_at ? new Date(r.deleted_at) : null,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { area, provider: providerSlug } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("service_provider_details")
    .select("business_name, city")
    .eq("slug", providerSlug)
    .single();

  const name = data?.business_name ?? providerSlug;
  const areaCode = area.toUpperCase();

  return {
    title: `${name} Reviews in ${areaCode} | Britestate`,
    description: `Read verified customer reviews for ${name}, a service provider in the ${areaCode} area. See ratings, feedback, and provider responses.`,
  };
}

export default async function ProviderReviewsPage({ params }: PageProps) {
  const { area, provider: providerSlug } = await params;
  const areaCode = area.toUpperCase();

  const supabase = await createClient();

  // Resolve provider by slug
  const { data: providerData, error: providerError } = await supabase
    .from("service_provider_details")
    .select(
      `
      id,
      business_name,
      city,
      slug,
      provider_rating_stats (
        avg_rating,
        total_reviews
      )
    `,
    )
    .eq("slug", providerSlug)
    .single();

  if (providerError || !providerData) {
    notFound();
  }

  // Fetch approved reviews for this provider (first page, most recent first)
  const PAGE_SIZE = 10;
  const { data: reviewsData, count } = await supabase
    .from("reviews")
    .select(
      `
      id,
      provider_id,
      reviewer_id,
      overall_rating,
      quality_rating,
      value_rating,
      title,
      review_text,
      provider_response,
      provider_response_at,
      moderation_status,
      deleted_at,
      created_at
    `,
      { count: "exact" },
    )
    .eq("provider_id", providerData.id)
    .eq("moderation_status", "approved")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(0, PAGE_SIZE - 1);

  const rawReviews = (reviewsData ?? []) as unknown as RawReviewRow[];
  const reviews: Review[] = rawReviews.map(toReview);
  const totalReviews = count ?? 0;

  const stats = Array.isArray(providerData.provider_rating_stats)
    ? providerData.provider_rating_stats[0]
    : providerData.provider_rating_stats;

  const avgRating = stats ? Number(stats.avg_rating) : 0;
  const statsTotal = stats ? Number(stats.total_reviews) : totalReviews;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": providerData.business_name,
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": avgRating.toFixed(1),
              "reviewCount": statsTotal,
              "bestRating": "5",
              "worstRating": "1",
            },
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
            {providerData.business_name}
          </li>
        </ol>
      </nav>

      {/* Hero with aggregate stats */}
      <ReviewAggregateHero
        areaCode={providerData.city ?? areaCode}
        avgRating={avgRating}
        totalReviews={statsTotal}
        totalProviders={1}
      />

      {/* Provider name heading */}
      <section className="mt-8">
        <h2 className="font-heading text-xl font-bold text-foreground">
          Reviews for {providerData.business_name}
        </h2>

        <div className="mt-4">
          <ReviewsList
            reviews={reviews}
            totalCount={totalReviews}
            pageSize={PAGE_SIZE}
          />
        </div>
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
