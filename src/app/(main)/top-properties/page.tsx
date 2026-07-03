import type { Metadata } from "next";
import { TopListCard } from "@/components/top-properties/TopListCard";
import {
  TopListPageView,
  TrackedLinkArea,
} from "@/components/top-properties/TopListAnalytics";
import { buildBreadcrumbJsonLd } from "@/lib/seo/breadcrumb-jsonld";
import { safeJsonLd } from "@/lib/seo/safe-json-ld";
import { CARD_PREVIEW_SIZE } from "@/lib/top-properties/top-list-config";
import { getAllTopLists } from "@/services/top-properties/top-list-service";
import { brandConfig } from "@/config/brand";

export const revalidate = 3600;

const TITLE = `Top Properties — Ranked Homes for Sale | ${brandConfig.displayName}`;
const DESCRIPTION = `Ranked lists of homes for sale on ${brandConfig.displayName}: priced below the local sold-price benchmark, best price per square foot, strongest buyer interest, and more — every ranking explained.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/top-properties" },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website" },
};

export default async function TopPropertiesHubPage() {
  const all = await getAllTopLists();
  // Hide thin categories entirely — the hub only shows lists with enough
  // real homes to be worth a click.
  const visible = [...all.values()].filter((result) => result.isIndexable);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Top Properties", path: "/top-properties" },
  ]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }}
      />
      <TopListPageView
        event="top_properties_page_view"
        properties={{ page: "hub" }}
      />

      <header className="max-w-3xl">
        <h1 className="font-heading text-3xl font-bold leading-tight tracking-tight text-neutral-900 lg:text-4xl">
          Top Properties
        </h1>
        <p className="mt-3 text-lg text-neutral-500">
          Every list below is ranked from real {brandConfig.displayName} listing
          data and HM Land Registry sold prices — and every ranking explains
          itself. No paid placement, ever.
        </p>
      </header>

      {visible.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-neutral-200 bg-muted p-10 text-center">
          <h2 className="font-heading text-lg font-bold text-neutral-900">
            Rankings are warming up
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
            We only publish a list once it has enough real homes to be
            meaningful. Check back soon — new listings are added every day.
          </p>
        </div>
      ) : (
        <TrackedLinkArea event="top_property_card_click">
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((result) => (
              <TopListCard
                key={result.category.slug}
                category={result.category}
                items={result.items.slice(0, CARD_PREVIEW_SIZE)}
              />
            ))}
          </div>
        </TrackedLinkArea>
      )}
    </main>
  );
}
