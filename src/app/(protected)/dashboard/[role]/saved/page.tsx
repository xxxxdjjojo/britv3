import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSavedProperties } from "@/services/saved/saved-properties-service";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Search,
  Bed,
  Bath,
  MapPin,
  SlidersHorizontal,
  SquareIcon,
  ArrowUpDown,
} from "lucide-react";
import { SavedPropertyRemoveButton } from "@/components/listings/SavedPropertyRemoveButton";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(price);
}

export const metadata = {
  title: "Saved Properties — Britestate",
  description: "Your saved properties shortlist",
};

export default async function SavedPropertiesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const savedProperties = await getSavedProperties(supabase, user.id);

  const count = savedProperties.length;

  return (
    <div className="flex flex-col gap-8">
      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-neutral-900">
            Saved Properties
          </h1>
          <p className="text-sm text-neutral-500">
            {count === 0
              ? "Start saving properties you love"
              : `${count} ${count === 1 ? "property" : "properties"} in your shortlist`}
          </p>
        </div>

        {/* Filter / sort bar — only shown when there are results */}
        {count > 0 && (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 rounded-lg text-xs font-medium text-neutral-600"
              >
                <SlidersHorizontal className="size-3.5" strokeWidth={1.25} />
                Filter
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 rounded-lg text-xs font-medium text-neutral-600"
              >
                <ArrowUpDown className="size-3.5" strokeWidth={1.25} />
                Sort
              </Button>
            </div>
            <p className="text-xs text-neutral-400">
              Showing {count} result{count !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>

      {/* ── Empty state ──────────────────────────────────────────────── */}
      {count === 0 ? (
        <Card className="overflow-hidden rounded-2xl shadow-sm">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-primary-lighter">
              <Heart
                className="size-8 text-brand-primary"
                strokeWidth={1.25}
              />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-heading text-lg font-semibold text-neutral-900">
                No saved properties yet
              </h3>
              <p className="max-w-sm text-sm text-neutral-500">
                Save properties while browsing and they&apos;ll appear here for
                easy comparison.
              </p>
            </div>
            <Link href="/search">
              <Button className="mt-2 gap-2 rounded-xl bg-brand-primary text-white hover:bg-brand-primary-light">
                <Search className="size-4" strokeWidth={1.25} />
                Search Properties
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        /* ── Property grid ─────────────────────────────────────────── */
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {savedProperties.map((saved) => {
            const { listing, property } = saved;
            const href = `/property/${listing.slug ?? listing.id}`;

            return (
              <Card
                key={saved.id}
                className="group overflow-hidden rounded-2xl shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] bg-neutral-100">
                  <Link
                    href={href}
                    className="block size-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
                    aria-label={`View ${property.title}`}
                  >
                    {/* Placeholder image bg */}
                    <div className="flex size-full items-center justify-center">
                      <Heart
                        className="size-12 text-neutral-200"
                        strokeWidth={1.25}
                      />
                    </div>
                  </Link>

                  {/* Listing type badge */}
                  <Badge
                    className="absolute left-3 top-3 bg-white/90 text-neutral-700 backdrop-blur-sm text-xs font-medium capitalize"
                  >
                    {listing.listing_type === "rent" ? "To Rent" : "For Sale"}
                  </Badge>

                  {/* Remove button */}
                  <div className="absolute right-3 top-3">
                    <SavedPropertyRemoveButton listingId={listing.id} />
                  </div>
                </div>

                <CardContent className="flex flex-col gap-2 p-4">
                  {/* Price */}
                  <p className="font-heading text-lg font-bold text-neutral-900">
                    {formatPrice(listing.price)}
                    {listing.listing_type === "rent" && listing.rent_frequency
                      ? (
                        <span className="ml-1 text-sm font-normal text-neutral-500">
                          / {listing.rent_frequency}
                        </span>
                      )
                      : null}
                  </p>

                  {/* Title */}
                  <Link href={href} className="group/link">
                    <h3 className="truncate text-sm font-medium text-neutral-900 group-hover/link:text-brand-primary transition-colors">
                      {property.title}
                    </h3>
                  </Link>

                  {/* Address */}
                  <div className="flex items-center gap-1 text-xs text-neutral-500">
                    <MapPin className="size-3 shrink-0" strokeWidth={1.25} />
                    <span className="truncate">
                      {property.address_line1}, {property.city}
                    </span>
                  </div>

                  {/* Specs */}
                  <div className="flex items-center gap-3 border-t border-neutral-100 pt-2 text-xs text-neutral-500">
                    <span className="flex items-center gap-1">
                      <Bed className="size-3" strokeWidth={1.25} />
                      {property.bedrooms}{" "}
                      <span className="sr-only">bedrooms</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Bath className="size-3" strokeWidth={1.25} />
                      {property.bathrooms}{" "}
                      <span className="sr-only">bathrooms</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <SquareIcon className="size-3" strokeWidth={1.25} />
                      <span className="capitalize">
                        {property.property_type.replace(/_/g, " ")}
                      </span>
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
