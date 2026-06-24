"use client";

/**
 * Horizontal "Hemnet style" property card for the Stitch search layout:
 * image on the left half, details on the right half. All fallbacks come from
 * the pure card-model mapper (Price on application / placeholder / omitted
 * sqft / non-link when no slug). Verified badge renders only when truly true.
 */

import Link from "next/link";
import Image from "next/image";
import { BedDouble, Bath, Square, BadgeCheck, KeyRound } from "lucide-react";
import { SaveButton } from "@/components/properties/SaveButton";
import { LocalSupportChips } from "./LocalSupportChips";
import { toCardModel } from "@/lib/search/card-model";
import type { SearchProperty } from "@/app/(main)/search/actions";
import { cn } from "@/lib/utils";

type PropertySearchCardProps = Readonly<{
  property: SearchProperty;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}>;

export function PropertySearchCard({
  property,
  isSelected = false,
  onSelect,
}: PropertySearchCardProps) {
  const model = toCardModel(property);

  const imageBlock = (
    <div className="relative aspect-[4/3] w-full md:aspect-auto md:h-full">
      {model.hasImage ? (
        <Image
          src={model.image as string}
          alt={`${model.title}, ${model.locationLabel}`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 text-xs text-neutral-400">
          Image unavailable
        </div>
      )}

      {/* Badges — only render what is genuinely true */}
      <div className="absolute left-4 top-4 flex gap-2">
        {model.isVerified && (
          <span className="flex items-center gap-1 rounded bg-white/90 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-primary backdrop-blur-sm">
            <BadgeCheck className="size-3" aria-hidden="true" />
            Verified
          </span>
        )}
        {model.isLetAgreed && (
          <span className="flex items-center gap-1 rounded bg-brand-primary px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
            <KeyRound className="size-3" aria-hidden="true" />
            Let agreed
          </span>
        )}
      </div>
    </div>
  );

  return (
    <article
      data-testid="property-search-card"
      data-selected={isSelected ? "true" : undefined}
      onMouseEnter={onSelect ? () => onSelect(property.id) : undefined}
      onFocus={onSelect ? () => onSelect(property.id) : undefined}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md md:flex-row",
        isSelected ? "border-brand-primary ring-1 ring-brand-primary" : "border-neutral-200",
      )}
    >
      {/* Image half — links to the property when a slug exists, else static.
          The favourite heart is a SIBLING of the link (never nested inside the
          anchor) so we don't render an invalid <a><button> and trigger a
          hydration error. */}
      <div className="relative w-full md:w-1/2">
        {model.href ? (
          <Link href={model.href} className="block h-full" aria-label={model.title}>
            {imageBlock}
          </Link>
        ) : (
          imageBlock
        )}

        {/* Favourite heart — DB-backed SaveButton, outside the card link */}
        <div className="absolute right-4 top-4 z-10">
          <SaveButton listingId={property.id} size="sm" />
        </div>
      </div>

      {/* Details half */}
      <div className="flex w-full flex-col border-neutral-100 md:w-1/2 md:border-l">
        <div className="flex-1 p-6">
          <div className="mb-1 flex items-start justify-between gap-3">
            <h3 className="text-lg font-bold text-neutral-900 transition-colors group-hover:text-brand-primary">
              {model.href ? (
                <Link href={model.href}>{model.title}</Link>
              ) : (
                model.title
              )}
            </h3>
            <div className="shrink-0 text-right">
              <span className="text-lg font-extrabold text-brand-primary">
                {model.priceLabel}
              </span>
              {model.isRent && (model.perWeekLabel || model.perRoomLabel) && (
                <p className="mt-0.5 text-[11px] font-medium text-neutral-400">
                  {[model.perWeekLabel, model.perRoomLabel]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </div>
          </div>

          <p className="mb-4 text-sm text-neutral-500">{model.locationLabel}</p>

          <div className="flex items-center gap-4 border-b border-neutral-100 pb-5 text-xs font-semibold text-neutral-500">
            <span className="flex items-center gap-1.5">
              <BedDouble className="size-4" aria-hidden="true" />
              {model.beds} {model.beds === 1 ? "Bed" : "Beds"}
            </span>
            <span className="flex items-center gap-1.5">
              <Bath className="size-4" aria-hidden="true" />
              {model.baths} {model.baths === 1 ? "Bath" : "Baths"}
            </span>
            {model.sqftLabel ? (
              <span className="flex items-center gap-1.5">
                <Square className="size-4" aria-hidden="true" />
                {model.sqftLabel}
              </span>
            ) : (
              <span className="text-neutral-400">Floor area unavailable</span>
            )}
            {model.furnishingLabel && (
              <span className="rounded-full border border-brand-primary/30 bg-brand-primary/5 px-2.5 py-0.5 text-[10px] font-semibold text-brand-primary">
                {model.furnishingLabel}
              </span>
            )}
          </div>

          {/* Listing Agent — honest: directory link, no fabricated names */}
          <div className="mt-5 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Listing Agent
            </p>
            <Link
              href="/agents"
              className="text-xs font-semibold text-neutral-700 hover:text-brand-primary"
            >
              View listing agents
            </Link>
          </div>
        </div>

        {/* Local Support trade chips — real directory links */}
        <LocalSupportChips postcode={model.postcode} />
      </div>
    </article>
  );
}
