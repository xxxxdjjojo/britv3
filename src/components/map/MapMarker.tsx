"use client";

/**
 * Property popup shown when a map pin is clicked.
 * Displays thumbnail, price, type, bedrooms, and a link to the detail page.
 */

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Bed, Home } from "lucide-react";

type MapMarkerProps = Readonly<{
  id: string;
  price: number;
  propertyType: string;
  bedrooms: number;
  address: string;
  thumbnailUrl?: string | null;
  slug?: string | null;
  listingType: "sale" | "rent";
  onClose?: () => void;
}>;

function formatPrice(price: number, listingType: "sale" | "rent"): string {
  const formatted = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);

  return listingType === "rent" ? `${formatted} pcm` : formatted;
}

function formatPropertyType(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function MapMarker({
  id,
  price,
  propertyType,
  bedrooms,
  address,
  thumbnailUrl,
  slug,
  listingType,
  onClose,
}: MapMarkerProps) {
  const href = slug ? `/properties/${slug}` : `/properties/${id}`;

  return (
    <Card className="w-64 shadow-lg" size="sm">
      {thumbnailUrl && (
        <img
          src={thumbnailUrl}
          alt={address}
          className="h-32 w-full rounded-t-xl object-cover"
        />
      )}
      <CardContent className="space-y-1">
        <p className="text-lg font-semibold text-brand-green">
          {formatPrice(price, listingType)}
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Home className="size-3" />
            {formatPropertyType(propertyType)}
          </span>
          <span className="flex items-center gap-1">
            <Bed className="size-3" />
            {bedrooms} bed{bedrooms !== 1 ? "s" : ""}
          </span>
        </div>
        <p className="truncate text-xs text-muted-foreground">{address}</p>
        <Link
          href={href}
          className="mt-1 inline-block text-xs font-medium text-brand-green underline-offset-2 hover:underline"
          onClick={onClose}
        >
          View details
        </Link>
      </CardContent>
    </Card>
  );
}
