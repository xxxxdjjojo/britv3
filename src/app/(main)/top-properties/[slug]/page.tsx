import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { RankedPropertyCard } from "@/components/top-properties/RankedPropertyCard";
import { TopListMethodology } from "@/components/top-properties/TopListMethodology";
import {
  TopListPageView,
  TrackedLinkArea,
} from "@/components/top-properties/TopListAnalytics";
import { buildBreadcrumbJsonLd } from "@/lib/seo/breadcrumb-jsonld";
import { safeJsonLd } from "@/lib/seo/safe-json-ld";
import {
  buildTopListItemListJsonLd,
  topListRobots,
} from "@/lib/seo/top-list-jsonld";
import {
  getAllTopListSlugs,
  getRelatedCategories,
  getTopListCategory,
} from "@/lib/top-properties/top-list-config";
import { getTopList } from "@/services/top-properties/top-list-service";
import { brandConfig } from "@/config/brand";

export const revalidate = 3600;

export function generateStaticParams() {
  return getAllTopListSlugs().map((slug) => ({ slug }));
}

type TopListPageProps = Readonly<{ params: Promise<{ slug: string }> }>;

export async function generateMetadata({
  params,
}: TopListPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = getTopListCategory(slug);
  if (!category) {
    return { title: `List Not Found | ${brandConfig.displayName}` };
  }
  // Thin lists are noindexed (robots) while staying followable, and are
  // excluded from the sitemap by getIndexableTopListSlugs.
  const result = await getTopList(slug);
  const title = `${category.metaTitle} | ${brandConfig.displayName}`;
  return {
    title,
    description: category.metaDescription,
    alternates: { canonical: `/top-properties/${category.slug}` },
    robots: topListRobots(result?.isIndexable ?? false),
    openGraph: {
      title,
      description: category.metaDescription,
      type: "website",
    },
  };
}

export default async function TopListPage({ params }: TopListPageProps) {
  const { slug } = await params;
  const result = await getTopList(slug);
  if (!result) notFound();

  const { category, items, generatedAt } = result;
  const related = getRelatedCategories(category.slug);

  const itemListJsonLd = buildTopListItemListJsonLd(category, items);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Top Properties", path: "/top-properties" },
    { name: category.shortTitle, path: `/top-properties/${category.slug}` },
  ]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12 lg:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
      />
      <TopListPageView
        event="top_properties_page_view"
        properties={{ page: "list", category: category.slug }}
      />

      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-neutral-500">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-brand-primary hover:underline">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href="/top-properties"
              className="hover:text-brand-primary hover:underline"
            >
              Top Properties
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-medium text-neutral-900">
            {category.shortTitle}
          </li>
        </ol>
      </nav>

      <header className="max-w-3xl">
        <h1 className="font-heading text-3xl font-bold leading-tight tracking-tight text-neutral-900 lg:text-4xl">
          {category.title}
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-neutral-500">
          {category.intro}
        </p>
      </header>

      <div className="mt-8">
        <TopListMethodology
          methodology={category.methodology}
          generatedAt={generatedAt}
        />
      </div>

      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-neutral-200 bg-muted p-10 text-center">
          <h2 className="font-heading text-lg font-bold text-neutral-900">
            No homes qualify right now
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
            We only rank homes with the real data this list needs — nothing is
            estimated to fill space. New listings are added every day, so check
            back soon.
          </p>
          <Link
            href="/search"
            className="mt-4 inline-flex items-center gap-2 font-semibold text-brand-primary hover:underline"
          >
            Browse all homes <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <TrackedLinkArea
          event="property_detail_click_from_top_list"
          properties={{ category: category.slug }}
        >
          <ol className="mt-10 flex flex-col gap-4" aria-label={category.title}>
            {items.map((item) => (
              <li key={item.listingId}>
                <RankedPropertyCard item={item} categorySlug={category.slug} />
              </li>
            ))}
          </ol>
        </TrackedLinkArea>
      )}

      <section aria-labelledby="related-lists-heading" className="mt-14">
        <h2
          id="related-lists-heading"
          className="font-heading text-xl font-bold text-neutral-900"
        >
          More top lists
        </h2>
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {related.map((relatedCategory) => (
            <li key={relatedCategory.slug}>
              <Link
                href={`/top-properties/${relatedCategory.slug}`}
                className="group flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 transition-colors hover:border-brand-primary focus-visible:outline-2 focus-visible:outline-brand-primary"
              >
                <span className="text-sm font-semibold text-neutral-900 group-hover:text-brand-primary">
                  {relatedCategory.shortTitle}
                </span>
                <ArrowRight
                  className="size-4 text-neutral-400 group-hover:text-brand-primary"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
