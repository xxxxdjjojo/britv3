"use client";

/**
 * Property listing card for search results.
 * Matches the Britestate "Invisible Estate" design system.
 */

import Link from "next/link";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { SaveButton } from "@/components/properties/SaveButton";
import { BedDoubleIcon, BathIcon, RulerIcon, EyeIcon, MapPinIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchListingRow } from "@/types/property";

/**
 * Format price for display (e.g., 250000 -> "250,000", 1200 rent -> "1,200 pcm").
 */
function formatPrice(
  price: number,
  listingType: string,
  rentFrequency?: string | null,
  qualifier?: string | null,
): string {
  const formatted = price.toLocaleString("en-GB");
  const prefix = qualifier === "poa" ? "POA" : `£${formatted}`;

  if (listingType === "rent") {
    const freq = rentFrequency === "weekly" ? "pw" : rentFrequency === "yearly" ? "pa" : "pcm";
    return `${prefix} ${freq}`;
  }

  return prefix;
}

/**
 * Format listing date as relative time (e.g., "2 days ago").
 */
function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
  }
  const months = Math.floor(diffDays / 30);
  return `${months} ${months === 1 ? "month" : "months"} ago`;
}

/**
 * Format property type for display (e.g., "semi_detached" -> "Semi-detached").
 */
function formatPropertyType(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("-");
}

type PropertyCardProps = Readonly<{
  listing: SearchListingRow;
  priority?: boolean;
}>;

export function PropertyCard({ listing, priority }: PropertyCardProps) {
  const href = listing.slug ? `/properties/${listing.slug}` : "#";

  return (
    <div className="group overflow-hidden rounded-2xl bg-white shadow-xs transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      <Link href={href} className="block">
        {/* Thumbnail */}
        <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
          {listing.thumbnail_url ? (
            <Image
              src={listing.thumbnail_url}
              alt={listing.title || "Property image"}
              fill
              priority={priority}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-neutral-300">
              <EyeIcon className="size-8 mb-2" />
              <span className="text-xs">No image available</span>
            </div>
          )}

          {/* Listing type badge */}
          <div className="absolute left-3 top-3">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                listing.listing_type === "rent"
                  ? "bg-brand-primary-lighter text-brand-primary"
                  : "bg-brand-secondary-light text-brand-secondary",
              )}
            >
              {listing.listing_type === "rent" ? "To Rent" : "For Sale"}
            </span>
          </div>

          {/* Save button */}
          <div
            className="absolute right-3 top-3"
            onClick={(e) => e.preventDefault()}
          >
            <SaveButton listingId={listing.listing_id} size="sm" />
          </div>
        </div>
      </Link>

      <Link href={href} className="block">
        <div className="flex flex-col gap-1.5 p-4">
          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-neutral-950">
              {formatPrice(
                listing.price,
                listing.listing_type,
                listing.rent_frequency,
                listing.price_qualifier,
              )}
            </span>
            {listing.price_qualifier && listing.price_qualifier !== "poa" && (
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                {listing.price_qualifier.replace("_", " ")}
              </span>
            )}
          </div>

          {/* Property type + key stats */}
          <div className="flex items-center gap-3 text-sm text-neutral-500">
            <span className="font-medium">{formatPropertyType(listing.property_type)}</span>
            <span className="flex items-center gap-1">
              <BedDoubleIcon className="size-3.5" />
              {listing.bedrooms}
            </span>
            <span className="flex items-center gap-1">
              <BathIcon className="size-3.5" />
              {listing.bathrooms}
            </span>
            {listing.square_footage && (
              <span className="flex items-center gap-1">
                <RulerIcon className="size-3.5" />
                {listing.square_footage.toLocaleString()} sq ft
              </span>
            )}
          </div>

          {/* Address */}
          <p className="flex items-center gap-1 truncate text-sm text-neutral-700">
            <MapPinIcon className="size-3.5 shrink-0 text-neutral-400" />
            {listing.address_line1}, {listing.city} {listing.postcode}
          </p>

          {/* Listed date */}
          <p className="text-xs text-neutral-400">
            Listed {formatRelativeDate(listing.listed_date)}
          </p>
        </div>
      </Link>
    </div>
  );
}

/**
 * Skeleton placeholder for loading state.
 */
export function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-xs animate-pulse">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-6 w-32 rounded-lg" />
        <Skeleton className="h-4 w-48 rounded-lg" />
        <Skeleton className="h-4 w-40 rounded-lg" />
        <Skeleton className="h-3 w-24 rounded-lg" />
      </div>
    </div>
  );
}
