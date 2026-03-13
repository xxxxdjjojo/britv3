/**
 * Tradesperson Public Profile Page
 *
 * SSR page at /services/[category]/[slug] that renders the full provider
 * profile: hero, tab navigation island, sidebar CTA, and JSON-LD.
 *
 * Tab content is provided by real Server Component tab panels (17-03):
 * ReviewsTab, PortfolioTab, ServicesTabWithModal + ServicesTab, QuoteModal.
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
import { ReviewsTab } from "@/components/providers/ReviewsTab";
import { PortfolioTab } from "@/components/providers/PortfolioTab";
import { ServicesTab } from "@/components/providers/ServicesTab";
import { ServicesTabWithModal } from "@/components/providers/ServicesTabWithModal";
import { QuoteModal } from "@/components/providers/QuoteModal";
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
