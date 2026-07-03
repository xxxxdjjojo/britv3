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
import { fetchProviderBySlug } from "@/services/providers/public-profile-service";
import { tradespersonProfilePath } from "@/lib/providers/profile-path";
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
import { TradespersonProfile } from "@/components/providers/TradespersonProfile";
import { ProviderSearchCard } from "@/components/providers/ProviderSearchCard";
import { CategoryPageFAQ } from "@/components/seo/CategoryPageFAQ";
import type { ServiceProviderPublicProfile } from "@/types/providers";

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
    return { title: "Provider Not Found | TrueDeed" };
  }
  const categoryLabel = SLUG_TO_CATEGORY[category] ?? category;
  const displayCategory = String(categoryLabel).replace(/_/g, " ");
  return {
    title: `${provider.business_name} | ${displayCategory} | TrueDeed`,
    description:
      provider.description ??
      `View ${provider.business_name}'s profile, reviews, portfolio and pricing on TrueDeed.`,
    // Consolidate SEO onto the canonical, category-free profile URL.
    alternates: { canonical: tradespersonProfilePath(slug) },
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
      profiles!inner(id, avatar_url, full_name:display_name, provider_verification_status),
      provider_rating_stats(average_rating, total_reviews, count_5_star, count_4_star, count_3_star, count_2_star, count_1_star, provider_id)
    `,
    )
    // NOTE: precise location filtering needs a postcode-area/geo mapping that does
    // not exist yet (service_provider_details has no `city` column; the previous
    // `city.ilike` branch referenced a non-existent column and errored the whole
    // query, leaving every SEO location page empty). For now these programmatic
    // landing pages list verified providers in the category, with the location
    // surfaced in the page copy/SEO metadata.
    .contains("services", [categoryDb])
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
        url: `https://truedeed.co.uk/services/${category}/${p.slug}`,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localJsonLd) }}
      />
      <div className="min-h-dvh bg-surface dark:bg-slate-950">
        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <nav className="flex text-xs text-muted-foreground mb-4 gap-2 items-center">
            <Link href="/" className="hover:text-brand-primary">
              Home
            </Link>
            <span>/</span>
            <Link href="/marketplace" className="hover:text-brand-primary">
              Services
            </Link>
            <span>/</span>
            <Link href={`/services/${category}`} className="hover:text-brand-primary">
              {categoryDisplay}
            </Link>
            <span>/</span>
            <span className="text-brand-primary font-medium">{locationDisplay}</span>
          </nav>

          {/* Hero */}
          <section className="mb-12">
            <h1 className="font-heading text-4xl md:text-5xl font-extrabold text-brand-primary-dark dark:text-white mb-4">
              {`Verified ${categoryDisplay} in `}
              <span className="text-brand-primary underline decoration-brand-primary/30 underline-offset-8">
                {locationDisplay}
              </span>
            </h1>
            <p className="text-lg text-muted-foreground dark:text-slate-400 mb-6">
              {meta.intro}
            </p>
            <div className="inline-flex gap-6 bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-border shadow-sm text-sm">
              <span>
                <strong className="text-brand-primary text-lg">
                  {providers?.length ?? 0}
                </strong>{" "}
                Pros Verified
              </span>
            </div>
          </section>

          {/* Provider cards */}
          <div className="space-y-4 mb-16">
            {(providers ?? []).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg font-medium">
                  No verified {categoryDisplay.toLowerCase()} found in{" "}
                  {locationDisplay}.
                </p>
                <p className="mt-2 text-sm">
                  <Link
                    href="/marketplace"
                    className="text-brand-primary hover:underline"
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
          <section className="mt-16 border-t border-border dark:border-slate-800 pt-12">
            <h2 className="text-xl font-bold mb-4">Also Looking For?</h2>
            <div className="flex flex-wrap gap-3">
              {Object.entries(CATEGORY_SLUGS)
                .filter(([k]) => k !== String(categoryDb))
                .slice(0, 6)
                .map(([, slug]) => (
                  <Link
                    key={slug}
                    href={`/services/${slug}/${location}`}
                    className="px-4 py-2 rounded-xl border border-border dark:border-slate-700 hover:border-brand-primary hover:text-brand-primary text-sm font-medium transition-colors"
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

  // Provider profile — delegate to the shared component so this legacy route and
  // the canonical /services/tradespeople/[slug] route render identically.
  return TradespersonProfile({ slug, categorySlug: category });
}
