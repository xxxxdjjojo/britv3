/**
 * Tradesperson Public Profile Page
 *
 * SSR page at /services/[category]/[slug] that renders the full provider
 * profile shell: hero, tab navigation island, sidebar CTA, and JSON-LD.
 *
 * Tab content panels (services, portfolio, reviews) are placeholders until
 * Plan 17-03 fills them in.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  fetchProviderBySlug,
  fetchProviderReviews,
  fetchPortfolioItems,
  fetchProviderServices,
} from "@/services/providers/public-profile-service";
import { buildProviderJsonLd } from "@/lib/providers/jsonld";
import { SLUG_TO_CATEGORY } from "@/lib/providers/category-slugs";
import ProviderHero from "@/components/providers/ProviderHero";
import ProviderSidebar from "@/components/providers/ProviderSidebar";
import StarRatingBreakdown from "@/components/providers/StarRatingBreakdown";
import { ProfileTabs } from "./ProfileTabs";

type Params = { params: Promise<{ category: string; slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug, category } = await params;
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

export default async function TradespersonProfilePage({ params }: Params) {
  const { slug, category } = await params;
  const provider = await fetchProviderBySlug(slug);
  if (!provider) {
    notFound();
  }

  const jsonLd = buildProviderJsonLd(provider, category);

  // Fetch initial data for the default tab (about) — uses provider.id (service_provider_details PK)
  const [reviews, portfolio, services] = await Promise.all([
    fetchProviderReviews(provider.id, 1),
    fetchPortfolioItems(provider.id),
    fetchProviderServices(provider.id),
  ]);

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
                      {/* Placeholder — ReviewsTab renders full list in 17-03 */}
                      <p className="text-slate-500 text-sm">
                        See Reviews tab for all {reviews.total} reviews.
                      </p>
                    </section>
                  </div>
                }
                services={
                  <div className="text-slate-500 text-sm">
                    Services &amp; Pricing — coming in Plan 17-03
                    {services.length > 0 && (
                      <p className="mt-2">({services.length} services available)</p>
                    )}
                  </div>
                }
                portfolio={
                  <div className="text-slate-500 text-sm">
                    Portfolio — coming in Plan 17-03
                    {portfolio.length > 0 && (
                      <p className="mt-2">({portfolio.length} portfolio items)</p>
                    )}
                  </div>
                }
                reviews={
                  <div className="text-slate-500 text-sm">
                    Reviews — coming in Plan 17-03
                    {reviews.total > 0 && (
                      <p className="mt-2">({reviews.total} reviews)</p>
                    )}
                  </div>
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
