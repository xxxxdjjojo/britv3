"use client";

/**
 * Sticky info bar displayed at the top of the property detail page.
 * Shows price, address, key stats, status badge, Price Velocity Indicator,
 * save/share actions, and a Book Viewing CTA on mobile.
 */

import { useCallback } from "react";
import { Bed, Bath, Square, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SaveButton } from "@/components/properties/SaveButton";
import { ShareButton } from "@/components/properties/ShareButton";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ListingStatus =
  | "draft"
  | "active"
  | "under_offer"
  | "sold"
  | "let"
  | "withdrawn"
  | "archived";

type StickyInfoBarProps = Readonly<{
  listing: {
    id: string;
    price: number;
    rentFrequency: string | null;
    priceQualifier: string | null;
    status: ListingStatus;
    listedDate: string;
    viewCount: number;
  };
  property: {
    title: string;
    addressLine1: string;
    city: string;
    postcode: string;
    bedrooms: number;
    bathrooms: number;
    squareFootage: number | null;
  };
  isSaved: boolean;
  onBookViewing?: () => void;
}>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<
  ListingStatus,
  { label: string; className: string }
> = {
  draft: { label: "Draft", className: "bg-neutral-100 text-neutral-600" },
  active: { label: "For Sale", className: "bg-success-light text-success-dark" },
  under_offer: {
    label: "Under Offer",
    className: "bg-warning-light text-warning-dark",
  },
  sold: { label: "Sold", className: "bg-error-light text-error-dark" },
  let: { label: "Let", className: "bg-brand-accent-light text-brand-accent" },
  withdrawn: {
    label: "Withdrawn",
    className: "bg-neutral-100 text-neutral-600",
  },
  archived: {
    label: "Archived",
    className: "bg-neutral-100 text-neutral-600",
  },
};

const gbpFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 0,
});

function formatPrice(
  price: number,
  qualifier: string | null,
  rentFrequency: string | null,
): string {
  const base = gbpFormatter.format(price);
  const suffix =
    rentFrequency === "monthly"
      ? "/month"
      : rentFrequency === "weekly"
        ? "/week"
        : "";
  const prefix = qualifier ? `${qualifier} ` : "";
  return `${prefix}${base}${suffix}`;
}

type VelocitySignal = {
  label: string;
  icon: string;
  className: string;
} | null;

function getPriceVelocity(listing: {
  listedDate: string;
  viewCount: number;
}): VelocitySignal {
  const daysListed = Math.floor(
    (Date.now() - new Date(listing.listedDate).getTime()) /
      (1000 * 60 * 60 * 24),
  );

  if (daysListed <= 7 && listing.viewCount > 50) {
    return {
      label: "Hot market",
      icon: "🔥",
      className: "bg-error-light text-error border border-error/20",
    };
  }

  if (listing.viewCount > 30) {
    return {
      label: "High interest",
      icon: "↗",
      className: "bg-warning-light text-warning border border-warning/20",
    };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PriceVelocityIndicator({
  listing,
}: {
  listing: { listedDate: string; viewCount: number };
}) {
  const signal = getPriceVelocity(listing);
  if (!signal) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        signal.className,
      )}
    >
      <span aria-hidden="true">{signal.icon}</span>
      {signal.label}
    </span>
  );
}

function StatItem({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ElementType;
  value: number | string;
  label: string;
}) {
  return (
    <span className="flex items-center gap-1 text-sm text-muted-foreground">
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="font-medium text-foreground">{value}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function StickyInfoBar({
  listing,
  property,
  onBookViewing,
}: StickyInfoBarProps) {
  const statusMeta = STATUS_LABELS[listing.status] ?? STATUS_LABELS.draft;
  const formattedPrice = formatPrice(
    listing.price,
    listing.priceQualifier,
    listing.rentFrequency,
  );
  const addressLine = `${property.addressLine1}, ${property.city}, ${property.postcode}`;

  const handleBookViewing = useCallback(() => {
    onBookViewing?.();
  }, [onBookViewing]);

  return (
    <div className="sticky top-16 z-20 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        {/* Desktop: single row. Mobile: two rows. */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: price + address + stats */}
          <div className="flex min-w-0 flex-col gap-1">
            {/* Price row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-2xl font-bold text-primary">
                {formattedPrice}
              </span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                  statusMeta.className,
                )}
              >
                {statusMeta.label}
              </span>
              <PriceVelocityIndicator listing={listing} />
            </div>

            {/* Address */}
            <span className="flex items-center gap-1 truncate text-sm text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
              {addressLine}
            </span>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-3">
              <StatItem
                icon={Bed}
                value={property.bedrooms}
                label={`${property.bedrooms} bedroom${property.bedrooms !== 1 ? "s" : ""}`}
              />
              <StatItem
                icon={Bath}
                value={property.bathrooms}
                label={`${property.bathrooms} bathroom${property.bathrooms !== 1 ? "s" : ""}`}
              />
              {property.squareFootage !== null && (
                <StatItem
                  icon={Square}
                  value={`${property.squareFootage.toLocaleString("en-GB")} sq ft`}
                  label={`${property.squareFootage} square feet`}
                />
              )}
            </div>
          </div>

          {/* Right: action buttons */}
          <div className="flex shrink-0 items-center gap-2">
            <SaveButton listingId={listing.id} size="sm" />
            <ShareButton title={property.title} />
            <Button
              size="sm"
              onClick={handleBookViewing}
              className="sm:hidden"
            >
              Book Viewing
            </Button>
            <Button
              size="default"
              onClick={handleBookViewing}
              className="hidden sm:inline-flex"
            >
              Book Viewing
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
