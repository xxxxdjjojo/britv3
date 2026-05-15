/**
 * Tradesperson Public Profile Page / SEO Category Location Page
 *
 * Dual-purpose route at /services/[category]/[slug]:
 *
 *   1. Provider profile — when [slug] is a provider slug (e.g. "smith-plumbing-london")
 *      SSR renders hero, tab navigation, sidebar CTA, and JSON-LD.
 *
 *   2. SEO category location page — when [slug] is a UK location (e.g. "london")
 *      ISR (revalidate = 3600) renders the SEO landing page with provider cards and FAQ.
 *
 * In-page disambiguation: isLocationSlug() inspects the slug and routes to the
 * correct render path. No new route directories are created.
 *
 * generateStaticParams pre-builds the top 200 category/location combinations
 * from the get_seo_category_locations RPC for fast ISR cache priming.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  fetchProviderBySlug,
  fetchProviderReviews,
  fetchPortfolioItems,
  fetchProviderServices,
} from "@/services/providers/public-profile-service";
import { buildProviderJsonLd } from "@/lib/providers/jsonld";
import { SLUG_TO_CATEGORY, CATEGORY_SLUGS } from "@/lib/providers/category-slugs";
import { isLocationSlug } from "@/lib/providers/location-slugs";
import {
  generateCategoryPageMeta,
  generateCategoryFAQs,
  formatLocationDisplay,
  formatCategoryDisplay,
} from "@/lib/providers/seo-utils";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import ProviderHero from "@/components/providers/ProviderHero";
import ProviderSidebar from "@/components/providers/ProviderSidebar";
import StarRatingBreakdown from "@/components/providers/StarRatingBreakdown";
import { ReviewsTab } from "@/components/providers/ReviewsTab";
import { PortfolioTab } from "@/components/providers/PortfolioTab";
import { ServicesTab } from "@/components/providers/ServicesTab";
import { ServicesTabWithModal } from "@/components/providers/ServicesTabWithModal";
import { QuoteModal } from "@/components/providers/QuoteModal";
import { ProfileTabs } from "./ProfileTabs";
import { ProviderSearchCard } from "@/components/providers/ProviderSearchCard";
import { CategoryPageFAQ } from "@/components/seo/CategoryPageFAQ";
import type { ServiceProviderPublicProfile } from "@/types/providers";
import { sanitizePostgrestInput } from "@/lib/validation/sanitize";

// ISR: revalidate every hour. Applies to location pages; provider profiles use
// dynamic rendering via fetchProviderBySlug (live data).
export const revalidate = 3600;

type Params = { params: Promise<{ category: string; slug: string }> };

// ---------------------------------------------------------------------------
// generateStaticParams — pre-build top 200 category/location combinations
// ---------------------------------------------------------------------------

export async function generateStaticParams() {
  try {
    // Use admin client — generateStaticParams runs at build time (no request scope / cookies)
    const supabase = createAdminClient();
    const { data } = await supabase.rpc("get_seo_category_locations");
    return (data ?? [])
      .slice(0, 200)
      .map(({ category, location }: { category: string; location: string }) => ({
        category:
          CATEGORY_SLUGS[category as keyof typeof CATEGORY_SLUGS] ?? category,
        slug: location,
      }));
  } catch {
    // If DB is not available at build time (e.g. CI without env vars), return empty array.
    // Pages will be rendered on-demand and then cached by ISR.
    return [];
  }
}

// ---------------------------------------------------------------------------
// generateMetadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, category } = await params;

  // Location page metadata
  if (isLocationSlug(slug)) {
    const locationDisplay = formatLocationDisplay(slug);
    const categoryDisplay = formatCategoryDisplay(category);
    const meta = generateCategoryPageMeta(categoryDisplay, locationDisplay);
    return {
      title: meta.title,
      description: meta.description,
    };
  }

  // Provider profile metadata
  const provider = await fetchProviderBySlug(slug);
  if (!provider) {
    return { title: "Provider Not Found | Britestate" };
  }
  const categoryLabel = SLUG_TO_CATEGORY[category] ?? category;
  const displayCategory = String(categoryLabel).replace(/_/g, " ");
  return {
    title: `${provider.business_name} | ${displayCategory} | Britestate`,
    description:
      provider.description ??
      `View ${provider.business_name}'s profile, reviews, portfolio and pricing on Britestate.`,
    openGraph: {
      title: provider.business_name,
      description: provider.description ?? undefined,
      type: "profile",
      images: provider.profiles.avatar_url
        ? [{ url: provider.profiles.avatar_url }]
        : [],
    },
  };
}

// ---------------------------------------------------------------------------
// SEO Category Location Page (local async component)
// ---------------------------------------------------------------------------

async function CategoryLocationPage({
  category,
  location,
}: {
  category: string;
  location: string;
}) {
  const supabase = await createClient();
  const categoryDb = SLUG_TO_CATEGORY[category] ?? category;
  const locationDisplay = formatLocationDisplay(location);
  const categoryDisplay = formatCategoryDisplay(category);
  const meta = generateCategoryPageMeta(categoryDisplay, locationDisplay);
  const faqs = generateCategoryFAQs(categoryDisplay, locationDisplay);

  const { data: providers } = await supabase
    .from("service_provider_details")
    .select(
      `
      *,
      profiles!inner(id, avatar_url, full_name, provider_verification_status, email),
      provider_rating_stats(avg_rating, total_reviews, five_star, four_star, three_star, two_star, one_star, provider_id)
    `,
    )
    .contains("services", [categoryDb])
    .or(
      `city.ilike.%${sanitizePostgrestInput(locationDisplay)}%,service_postcodes.cs.{${sanitizePostgrestInput(location.split("-")[0].toUpperCase())}}`,
    )
    .eq("profiles.provider_verification_status", "verified")
    .order("created_at", { ascending: false })
    .limit(20);

  const localJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: meta.h1,
    description: meta.description,
    numberOfItems: providers?.length ?? 0,
    itemListElement: (providers ?? []).slice(0, 5).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "LocalBusiness",
        name: p.business_name,
        url: `https://britestate.co.uk/services/${category}/${p.slug}`,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localJsonLd) }}
      />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <nav className="flex text-xs text-slate-500 mb-4 gap-2 items-center">
            <Link href="/" className="hover:text-[#2563EB]">
              Home
            </Link>
            <span>/</span>
            <Link href="/marketplace" className="hover:text-[#2563EB]">
              Services
            </Link>
            <span>/</span>
            <Link href={`/services/${category}`} className="hover:text-[#2563EB]">
              {categoryDisplay}
            </Link>
            <span>/</span>
            <span className="text-[#2563EB] font-medium">{locationDisplay}</span>
          </nav>

          {/* Hero */}
          <section className="mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4">
              {`Verified ${categoryDisplay} in `}
              <span className="text-[#2563EB] underline decoration-[#2563EB]/30 underline-offset-8">
                {locationDisplay}
              </span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
              {meta.intro}
            </p>
            <div className="inline-flex gap-6 bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 shadow-sm text-sm">
              <span>
                <strong className="text-[#2563EB] text-lg">
                  {providers?.length ?? 0}
                </strong>{" "}
                Pros Verified
              </span>
            </div>
          </section>

          {/* Provider cards */}
          <div className="space-y-4 mb-16">
            {(providers ?? []).length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <p className="text-lg font-medium">
                  No verified {categoryDisplay.toLowerCase()} found in{" "}
                  {locationDisplay}.
                </p>
                <p className="mt-2 text-sm">
                  <Link
                    href="/marketplace"
                    className="text-[#2563EB] hover:underline"
                  >
                    Browse all services
                  </Link>
                </p>
              </div>
            ) : (
              (providers ?? []).map((provider) => (
                <ProviderSearchCard
                  key={provider.id}
                  provider={provider as unknown as ServiceProviderPublicProfile}
                  category={category}
                />
              ))
            )}
          </div>

          {/* FAQ */}
          <CategoryPageFAQ
            faqs={faqs}
            category={categoryDisplay}
            location={locationDisplay}
          />

          {/* Related categories */}
          <section className="mt-16 border-t border-slate-200 dark:border-slate-800 pt-12">
            <h2 className="text-xl font-bold mb-4">Also Looking For?</h2>
            <div className="flex flex-wrap gap-3">
              {Object.entries(CATEGORY_SLUGS)
                .filter(([k]) => k !== String(categoryDb))
                .slice(0, 6)
                .map(([, slug]) => (
                  <Link
                    key={slug}
                    href={`/services/${slug}/${location}`}
                    className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-[#2563EB] hover:text-[#2563EB] text-sm font-medium transition-colors"
                  >
                    {formatCategoryDisplay(slug)} in {locationDisplay}
                  </Link>
                ))}
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Main page — dispatches to location page or provider profile
// ---------------------------------------------------------------------------

export default async function TradespersonProfilePage({ params }: Params) {
  const { slug, category } = await params;

  // In-page disambiguation: if slug looks like a UK location, render SEO page
  if (isLocationSlug(slug)) {
    return <CategoryLocationPage category={category} location={slug} />;
  }

  // Provider profile path
  const provider = await fetchProviderBySlug(slug);
  if (!provider) {
    notFound();
  }

  const jsonLd = buildProviderJsonLd(provider, category);

  // Fetch initial data for all tabs in parallel
  const [reviews, portfolio, services] = await Promise.all([
    fetchProviderReviews(provider.id, 1),
    fetchPortfolioItems(provider.id),
    fetchProviderServices(provider.id),
  ]);

  // Service names for the QuoteModal dropdown
  const serviceNames = services.map((s) => s.name);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <ProviderHero provider={provider} category={category} />
        <main className="max-w-7xl mx-auto px-6 py-8 relative">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <ProfileTabs
                about={
                  <div className="space-y-8">
                    {/* About section */}
                    <section>
                      <h3 className="text-2xl font-bold mb-4">
                        About {provider.business_name}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
                        {provider.description ?? "No description provided."}
                      </p>
                    </section>

                    {/* Rating breakdown */}
                    {provider.provider_rating_stats && (
                      <StarRatingBreakdown stats={provider.provider_rating_stats} />
                    )}

                    {/* Recent reviews preview */}
                    <section>
                      <h3 className="text-xl font-bold mb-4">Recent Reviews</h3>
                      <p className="text-slate-500 text-sm">
                        See Reviews tab for all {reviews.total} reviews.
                      </p>
                    </section>
                  </div>
                }
                services={
                  <ServicesTabWithModal
                    modal={({ open, initialService, onOpenChange }) => (
                      <QuoteModal
                        providerId={provider.id}
                        providerName={provider.business_name}
                        services={serviceNames}
                        open={open}
                        initialService={initialService}
                        onOpenChange={onOpenChange}
                      />
                    )}
                  >
                    <ServicesTab
                      services={services}
                      providerId={provider.id}
                    />
                  </ServicesTabWithModal>
                }
                portfolio={
                  <PortfolioTab
                    items={portfolio}
                    providerName={provider.business_name}
                  />
                }
                reviews={
                  <ReviewsTab
                    reviews={reviews.reviews}
                    total={reviews.total}
                    providerName={provider.business_name}
                    providerId={provider.id}
                  />
                }
              />
            </div>
            <aside className="lg:w-[380px]">
              <ProviderSidebar provider={provider} />
            </aside>
          </div>
        </main>
      </div>
    </>
  );
}
