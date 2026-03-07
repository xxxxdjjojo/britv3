/**
 * Property detail page layout -- server component that composes gallery,
 * key stats, description, features, price history, location, and action bar.
 */

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BedDoubleIcon,
  BathIcon,
  SofaIcon,
  RulerIcon,
  ZapIcon,
  CalendarIcon,
  TrendingDownIcon,
} from "lucide-react";
import type { Listing, Property, PropertyMedia, PriceHistory } from "@/types/property";
import { PropertyGallery } from "./PropertyGallery";
import { PropertyFeatures } from "./PropertyFeatures";
import { PropertyActions } from "./PropertyActions";

type PropertyDetailProps = Readonly<{
  listing: Listing;
  property: Property;
  media: PropertyMedia[];
  priceHistory: PriceHistory[];
}>;

function formatPrice(price: number, listingType: string, rentFrequency?: string | null): string {
  const formatted = price.toLocaleString("en-GB");
  if (listingType === "rent") {
    const freq = rentFrequency === "weekly" ? "pw" : rentFrequency === "yearly" ? "pa" : "pcm";
    return `\u00A3${formatted} ${freq}`;
  }
  return `\u00A3${formatted}`;
}

function formatDate(dateStr: string | Date): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function PropertyDetail({
  listing,
  property,
  media,
  priceHistory,
}: PropertyDetailProps) {
  const photos = media.filter((m) => m.media_type === "image");
  const floorPlans = media.filter((m) => m.media_type === "floor_plan");

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Gallery hero */}
      <PropertyGallery photos={photos} floorPlans={floorPlans} />

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Main content */}
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={listing.listing_type === "rent" ? "secondary" : "default"}>
                {listing.listing_type === "rent" ? "To Rent" : "For Sale"}
              </Badge>
              {listing.price_qualifier && listing.price_qualifier !== "poa" && (
                <Badge variant="outline">
                  {listing.price_qualifier.replace("_", " ")}
                </Badge>
              )}
            </div>
            <h1 className="mt-2 text-2xl font-bold md:text-3xl">
              {property.title}
            </h1>
            <p className="mt-1 text-lg text-muted-foreground">
              {property.address_line1}
              {property.address_line2 ? `, ${property.address_line2}` : ""}
              , {property.city} {property.postcode}
            </p>
            <p className="mt-2 text-3xl font-bold text-primary">
              {formatPrice(listing.price, listing.listing_type, listing.rent_frequency)}
            </p>
          </div>

          {/* Key stats row */}
          <div className="flex flex-wrap gap-6 rounded-lg border bg-muted/30 p-4">
            <Stat icon={<BedDoubleIcon className="size-5" />} label="Bedrooms" value={String(property.bedrooms)} />
            <Stat icon={<BathIcon className="size-5" />} label="Bathrooms" value={String(property.bathrooms)} />
            {property.reception_rooms != null && (
              <Stat icon={<SofaIcon className="size-5" />} label="Receptions" value={String(property.reception_rooms)} />
            )}
            {property.square_footage != null && (
              <Stat icon={<RulerIcon className="size-5" />} label="Size" value={`${property.square_footage.toLocaleString()} sq ft`} />
            )}
            {property.epc_rating && (
              <Stat icon={<ZapIcon className="size-5" />} label="EPC" value={property.epc_rating} />
            )}
          </div>

          {/* Description */}
          <div>
            <h2 className="text-lg font-semibold">Description</h2>
            <Separator className="my-3" />
            <div className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {property.description}
            </div>
          </div>

          {/* Features */}
          {property.features && Object.keys(property.features).length > 0 && (
            <div>
              <h2 className="text-lg font-semibold">Features</h2>
              <Separator className="my-3" />
              <PropertyFeatures features={property.features} />
            </div>
          )}

          {/* Details table */}
          <div>
            <h2 className="text-lg font-semibold">Property Details</h2>
            <Separator className="my-3" />
            <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              {property.tenure && (
                <DetailRow label="Tenure" value={property.tenure.replace("_", " ")} />
              )}
              {property.council_tax_band && (
                <DetailRow label="Council Tax Band" value={property.council_tax_band} />
              )}
              {property.year_built != null && (
                <DetailRow label="Year Built" value={String(property.year_built)} />
              )}
              {property.lease_remaining_years != null && (
                <DetailRow label="Lease Remaining" value={`${property.lease_remaining_years} years`} />
              )}
              {listing.service_charge_annual != null && (
                <DetailRow label="Service Charge" value={`\u00A3${listing.service_charge_annual.toLocaleString("en-GB")}/year`} />
              )}
              {listing.ground_rent_annual != null && (
                <DetailRow label="Ground Rent" value={`\u00A3${listing.ground_rent_annual.toLocaleString("en-GB")}/year`} />
              )}
              {property.new_build && (
                <DetailRow label="New Build" value="Yes" />
              )}
              <DetailRow label="Listed" value={formatDate(listing.listed_date)} />
            </dl>
          </div>

          {/* Price history */}
          {priceHistory.length > 0 && (
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <TrendingDownIcon className="size-5" />
                Price History
              </h2>
              <Separator className="my-3" />
              <div className="space-y-2">
                {priceHistory.map((ph) => (
                  <div
                    key={ph.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="size-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {formatDate(ph.changed_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground line-through">
                        {"\u00A3"}{ph.old_price.toLocaleString("en-GB")}
                      </span>
                      <span className="font-medium">
                        {"\u00A3"}{ph.new_price.toLocaleString("en-GB")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location map placeholder */}
          <div>
            <h2 className="text-lg font-semibold">Location</h2>
            <Separator className="my-3" />
            {property.coordinates ? (
              <div className="h-64 overflow-hidden rounded-lg border">
                {/* Map will render client-side via PropertyActions wrapper below */}
                <div className="flex h-full items-center justify-center bg-muted text-sm text-muted-foreground">
                  Map loading...
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {property.address_line1}, {property.city} {property.postcode}
              </p>
            )}
          </div>
        </div>

        {/* Sidebar -- action bar */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <PropertyActions
            listingId={listing.id}
            title={property.title}
            coordinates={property.coordinates}
          />
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: Readonly<{ icon: React.ReactNode; label: string; value: string }>) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: Readonly<{ label: string; value: string }>) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium capitalize">{value}</dd>
    </>
  );
}
