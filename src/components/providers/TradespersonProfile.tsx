/**
 * TradespersonProfile — shared async Server Component
 *
 * The single implementation of an individual tradesperson public profile
 * (hero, tabbed About/Services/Portfolio/Reviews, sticky Get-a-Quote sidebar,
 * JSON-LD). Rendered by BOTH:
 *   - the canonical route  /services/tradespeople/[slug]
 *   - the legacy SEO route /services/[category]/[slug]  (back-compat)
 * so the two can never diverge.
 *
 * Returns the fully-resolved tree (not a nested async element) so callers can
 * `return await TradespersonProfile(...)` and let notFound() propagate.
 */

import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  fetchProviderBySlug,
  fetchProviderReviews,
  fetchPortfolioItems,
  fetchProviderServices,
} from "@/services/providers/public-profile-service";
import { buildProviderJsonLd } from "@/lib/providers/jsonld";
import { CATEGORY_SLUGS } from "@/lib/providers/category-slugs";
import type { ServiceCategory } from "@/types/marketplace";
import ProviderHero from "@/components/providers/ProviderHero";
import ProviderSidebar from "@/components/providers/ProviderSidebar";
import StarRatingBreakdown from "@/components/providers/StarRatingBreakdown";
import { ReviewsTab } from "@/components/providers/ReviewsTab";
import { PortfolioTab } from "@/components/providers/PortfolioTab";
import { ServicesTab } from "@/components/providers/ServicesTab";
import { ServicesTabWithModal } from "@/components/providers/ServicesTabWithModal";
import { ProfileTabs } from "@/components/profiles/ProfileTabs";

type TradespersonProfileProps = Readonly<{
  slug: string;
  /**
   * Category slug for the hero subtitle/breadcrumb. Optional — the canonical
   * route has no category segment, so it is derived from the provider's first
   * service when omitted.
   */
  categorySlug?: string;
}>;

function deriveCategorySlug(services: readonly string[] | null | undefined): string {
  const first = services?.[0] as ServiceCategory | undefined;
  return (first && CATEGORY_SLUGS[first]) || "other-services";
}

export async function TradespersonProfile({ slug, categorySlug }: TradespersonProfileProps) {
  const provider = await fetchProviderBySlug(slug);
  if (!provider) {
    notFound();
  }

  const category = categorySlug ?? deriveCategorySlug(provider.services);
  const jsonLd = buildProviderJsonLd(provider, category);

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
      <div className="min-h-screen bg-surface dark:bg-slate-950">
        <ProviderHero provider={provider} category={category} />
        <main className="max-w-7xl mx-auto px-6 py-8 relative">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <ProfileTabs
                tabs={[
                  {
                    id: "about",
                    label: "About",
                    content: (
                      <div className="space-y-8">
                        <section>
                          <h3 className="text-2xl font-bold mb-4">
                            About {provider.business_name}
                          </h3>
                          <p className="text-muted-foreground dark:text-slate-400 leading-relaxed max-w-3xl">
                            {provider.description ?? "No description provided."}
                          </p>
                        </section>
                        {provider.provider_rating_stats && (
                          <StarRatingBreakdown stats={provider.provider_rating_stats} />
                        )}
                        <section>
                          <h3 className="text-xl font-bold mb-4">Recent Reviews</h3>
                          <p className="text-muted-foreground text-sm">
                            See the Reviews tab for all {reviews.total} reviews.
                          </p>
                        </section>
                      </div>
                    ),
                  },
                  {
                    id: "services",
                    label: "Services & Pricing",
                    content: (
                      <ServicesTabWithModal
                        providerUserId={provider.user_id}
                        providerName={provider.business_name}
                        categories={provider.services ?? []}
                      >
                        <ServicesTab services={services} providerId={provider.id} />
                      </ServicesTabWithModal>
                    ),
                  },
                  {
                    id: "portfolio",
                    label: "Portfolio",
                    content: (
                      <PortfolioTab
                        items={portfolio}
                        providerName={provider.business_name}
                      />
                    ),
                  },
                  {
                    id: "reviews",
                    label: "Reviews",
                    content: (
                      <ReviewsTab
                        reviews={reviews.reviews}
                        total={reviews.total}
                        providerName={provider.business_name}
                        providerId={provider.id}
                      />
                    ),
                  },
                ]}
              />
            </div>
            <aside className="lg:w-[380px]">
              <Suspense fallback={null}>
                <ProviderSidebar provider={provider} />
              </Suspense>
            </aside>
          </div>
        </main>
      </div>
    </>
  );
}
