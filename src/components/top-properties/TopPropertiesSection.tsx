import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TopListCard } from "@/components/top-properties/TopListCard";
import {
  TopListPageView,
  TrackedLinkArea,
} from "@/components/top-properties/TopListAnalytics";
import { CARD_PREVIEW_SIZE } from "@/lib/top-properties/top-list-config";
import { getAllTopLists } from "@/services/top-properties/top-list-service";
import type { TopListResult } from "@/lib/top-properties/types";

/** How many list cards the homepage module shows. */
const HOMEPAGE_CARD_COUNT = 3;

/**
 * Homepage "Top Properties" module — the strongest few list cards, each
 * previewing its top homes from real data. Renders nothing at all when no
 * list has enough items, so the homepage never shows an empty shell.
 */
export async function TopPropertiesSection() {
  let results: TopListResult[] = [];
  try {
    const all = await getAllTopLists();
    results = [...all.values()].filter((result) => result.isIndexable);
  } catch {
    // A ranking failure must never take the homepage down.
    return null;
  }

  if (results.length === 0) return null;

  const featured = results.slice(0, HOMEPAGE_CARD_COUNT);

  return (
    <section
      aria-labelledby="top-properties-heading"
      className="px-6 py-16 lg:py-24 max-w-7xl mx-auto"
    >
      <TopListPageView event="homepage_top_list_view" />
      <div className="flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2
              id="top-properties-heading"
              className="text-neutral-900 text-3xl lg:text-4xl font-bold leading-tight tracking-tight font-heading"
            >
              Top Properties
            </h2>
            <p className="text-neutral-500 mt-2 text-lg">
              Ranked from real listing data and local sold prices — see exactly
              why each home makes the list.
            </p>
          </div>
          <Link
            href="/top-properties"
            className="inline-flex items-center gap-2 text-brand-primary font-semibold hover:underline"
          >
            All top lists <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        <TrackedLinkArea event="homepage_top_list_click">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((result) => (
              <TopListCard
                key={result.category.slug}
                category={result.category}
                items={result.items.slice(0, CARD_PREVIEW_SIZE)}
              />
            ))}
          </div>
        </TrackedLinkArea>
      </div>
    </section>
  );
}
