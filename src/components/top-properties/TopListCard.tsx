import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ImageOff } from "lucide-react";
import { RankingBadge } from "@/components/top-properties/RankingBadge";
import type { TopListCategory, TopListItem } from "@/lib/top-properties/types";

function formatPrice(price: number): string {
  return `£${price.toLocaleString("en-GB")}`;
}

type Props = Readonly<{
  category: TopListCategory;
  items: TopListItem[];
}>;

/**
 * One top-list preview card (homepage + hub): the category, its top few
 * homes, and a "View full list" CTA to the category page.
 */
export function TopListCard({ category, items }: Props) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <header className="mb-4">
        <h3 className="font-heading text-lg font-bold text-neutral-900">
          {category.shortTitle}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-neutral-500">
          {category.metaDescription}
        </p>
      </header>

      <ol className="flex flex-1 flex-col gap-3" aria-label={category.title}>
        {items.map((item) => (
          <li key={item.listingId}>
            <Link
              href={`/properties/${item.listingSlug}`}
              data-analytics-category={category.slug}
              data-analytics-rank={String(item.rank)}
              className="group flex items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-brand-primary"
            >
              <span
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-primary-lighter text-xs font-bold text-brand-primary"
                aria-label={`Ranked number ${item.rank}`}
              >
                {item.rank}
              </span>
              <span className="relative block h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.imageAlt ?? item.title}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-neutral-400">
                    <ImageOff className="size-4" aria-hidden="true" />
                    <span className="sr-only">No photo available</span>
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-neutral-900 group-hover:text-brand-primary">
                  {item.title}
                </span>
                <span className="block truncate text-xs text-neutral-500">
                  {item.city} · {formatPrice(item.price)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>

      {items[0] && (
        <div className="mt-3">
          <RankingBadge label={category.badgeLabel} reason={items[0].reason} />
        </div>
      )}

      <footer className="mt-4 border-t border-neutral-100 pt-4">
        <Link
          href={`/top-properties/${category.slug}`}
          data-analytics-category={category.slug}
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary hover:underline focus-visible:outline-2 focus-visible:outline-brand-primary"
        >
          View full list <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </footer>
    </article>
  );
}
