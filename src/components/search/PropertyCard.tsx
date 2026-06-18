"use client";

/**
 * Property listing card for search results.
 * Shows thumbnail, price, type, beds/baths, address, listed date, and save button.
 */

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SaveButton } from "@/components/properties/SaveButton";
import { BedDoubleIcon, BathIcon, RulerIcon, EyeIcon } from "lucide-react";
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
  const prefix = qualifier === "poa" ? "POA" : `\u00A3${formatted}`;

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
  // Render a non-link wrapper when there is no slug — never a dead "#" href.
  const href = listing.slug ? `/properties/${listing.slug}` : null;

  const thumbnail = (
    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
      {listing.thumbnail_url ? (
        <Image
          src={listing.thumbnail_url}
          alt={listing.title || "Property image"}
          fill
          priority={priority}
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <EyeIcon className="size-8" />
        </div>
      )}

      {/* Listing type badge */}
      <Badge variant="default" className="absolute left-2 top-2">
        {listing.listing_type === "rent" ? "To Rent" : "For Sale"}
      </Badge>

      {/* Save button */}
      <div className="absolute right-2 top-2" onClick={(e) => e.preventDefault()}>
        <SaveButton listingId={listing.listing_id} size="sm" />
      </div>
    </div>
  );

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
      {href ? (
        <Link href={href} className="block">
          {thumbnail}
        </Link>
      ) : (
        <div className="block">{thumbnail}</div>
      )}

      <CardContent className="flex flex-col gap-1.5 pt-3">
        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-semibold">
            {formatPrice(
              listing.price,
              listing.listing_type,
              listing.rent_frequency,
              listing.price_qualifier,
            )}
          </span>
          {listing.price_qualifier && listing.price_qualifier !== "poa" && (
            <Badge variant="secondary" className="text-xs">
              {listing.price_qualifier.replace("_", " ")}
            </Badge>
          )}
        </div>

        {/* Property type + key stats */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{formatPropertyType(listing.property_type)}</span>
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
        <p className="truncate text-sm">
          {listing.address_line1}, {listing.city} {listing.postcode}
        </p>

        {/* Listed date */}
        <p className="text-xs text-muted-foreground">
          Listed {formatRelativeDate(listing.listed_date)}
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton placeholder for loading state.
 */
export function PropertyCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <CardContent className="flex flex-col gap-2 pt-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-24" />
      </CardContent>
    </Card>
  );
}
