import Image from "next/image";
import Link from "next/link";
import { Bath, BedDouble, ImageOff, MapPin, Ruler } from "lucide-react";
import { RankingBadge } from "@/components/top-properties/RankingBadge";
import type { TopListItem } from "@/lib/top-properties/types";

function formatPrice(price: number): string {
  return `£${price.toLocaleString("en-GB")}`;
}

type Props = Readonly<{
  item: TopListItem;
  categorySlug: string;
}>;

/**
 * One ranked property row on a full list page. The whole card is a single
 * link to the property detail page; the rank is rendered as visible text.
 */
export function RankedPropertyCard({ item, categorySlug }: Props) {
  return (
    <Link
      href={`/properties/${item.listingSlug}`}
      data-analytics-category={categorySlug}
      data-analytics-rank={String(item.rank)}
      className="group flex gap-4 rounded-2xl border border-neutral-200 bg-white p-4 transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-brand-primary sm:gap-6 sm:p-5"
    >
      {/* Rank */}
      <div className="flex shrink-0 flex-col items-center justify-start pt-1">
        <span
          className="flex size-9 items-center justify-center rounded-full bg-brand-primary text-base font-bold text-white sm:size-10"
          aria-label={`Ranked number ${item.rank}`}
        >
          {item.rank}
        </span>
      </div>

      {/* Thumbnail */}
      <div className="relative hidden h-24 w-32 shrink-0 overflow-hidden rounded-xl bg-neutral-100 sm:block sm:h-28 sm:w-40">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.imageAlt ?? item.title}
            fill
            sizes="160px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-neutral-400">
            <ImageOff className="size-6" aria-hidden="true" />
            <span className="sr-only">No photo available</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <h3 className="font-heading text-base font-bold text-neutral-900 group-hover:text-brand-primary sm:text-lg">
            {item.title}
          </h3>
          <p className="text-base font-bold text-brand-primary sm:text-lg">
            {formatPrice(item.price)}
          </p>
        </div>

        <p className="flex items-center gap-1 text-sm text-neutral-500">
          <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
          {item.city}
          {item.postcode ? ` · ${item.postcode}` : ""}
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-600">
          {item.bedrooms != null && (
            <span className="flex items-center gap-1">
              <BedDouble className="size-4" aria-hidden="true" />
              {item.bedrooms} {item.bedrooms === 1 ? "bed" : "beds"}
            </span>
          )}
          {item.bathrooms != null && (
            <span className="flex items-center gap-1">
              <Bath className="size-4" aria-hidden="true" />
              {item.bathrooms} {item.bathrooms === 1 ? "bath" : "baths"}
            </span>
          )}
          {item.squareFootage != null && (
            <span className="flex items-center gap-1">
              <Ruler className="size-4" aria-hidden="true" />
              {item.squareFootage.toLocaleString("en-GB")} sq ft
            </span>
          )}
        </div>

        <div className="mt-1">
          <RankingBadge label="Why it ranks" reason={item.reason} />
        </div>
      </div>
    </Link>
  );
}
