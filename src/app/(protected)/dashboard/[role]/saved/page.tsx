import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSavedProperties } from "@/services/saved/saved-properties-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Search,
  Bed,
  Bath,
  Maximize,
  Plus,
  LayoutGrid,
  List,
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
  title: "Saved Properties - Britestate",
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

  return (
    <div className="space-y-8">
      {/* Header row: editorial title + filter pills, view toggle, sort */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-brand-primary-dark md:text-4xl">
            Saved Properties
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            {savedProperties.length}{" "}
            {savedProperties.length === 1 ? "property" : "properties"} saved
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Filter pills */}
          <div className="inline-flex items-center rounded-full border border-border bg-surface p-1">
            <span className="rounded-full bg-brand-primary px-4 py-1.5 text-xs font-semibold text-white">
              For Sale
            </span>
            <span className="rounded-full px-4 py-1.5 text-xs font-medium text-neutral-500">
              To Rent
            </span>
          </div>

          {/* View toggle */}
          <div className="inline-flex items-center rounded-full border border-border bg-surface p-1">
            <span className="flex size-7 items-center justify-center rounded-full bg-brand-primary text-white">
              <LayoutGrid className="size-3.5" />
            </span>
            <span className="flex size-7 items-center justify-center rounded-full text-neutral-500">
              <List className="size-3.5" />
            </span>
          </div>

          {/* Sort */}
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-xs font-medium text-neutral-600">
            <span className="text-neutral-400">Sort by</span>
            <span className="font-semibold text-neutral-900">Date Saved</span>
          </div>
        </div>
      </div>

      {savedProperties.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface py-16 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-neutral-100">
            <Heart className="size-8 text-neutral-400" />
          </div>
          <h3 className="mt-4 font-heading text-lg font-bold text-brand-primary-dark">
            No saved properties yet
          </h3>
          <p className="mt-2 max-w-md text-sm text-neutral-500">
            You haven&apos;t saved any properties yet. Start searching to find
            properties you like.
          </p>
          <Link href="/search" className="mt-6">
            <Button className="gap-2">
              <Search className="size-4" />
              Search Properties
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {savedProperties.map((saved) => {
            const { listing, property } = saved;
            const isFeatured = listing.favorite_count > 0;

            return (
              <article
                key={saved.id}
                className="group flex flex-col overflow-hidden rounded-xl border border-border bg-white transition-shadow hover:shadow-sm"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] bg-neutral-100">
                  <Link href={`/properties/${listing.slug ?? listing.id}`}>
                    <div className="flex size-full items-center justify-center text-neutral-300">
                      <Heart className="size-12" />
                    </div>
                  </Link>
                  {isFeatured && (
                    <Badge className="absolute left-3 top-3 bg-brand-gold text-[10px] font-bold uppercase tracking-[0.08em] text-brand-gold-foreground">
                      Featured
                    </Badge>
                  )}
                  <SavedPropertyRemoveButton listingId={listing.id} />
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/properties/${listing.slug ?? listing.id}`}
                      className="min-w-0"
                    >
                      <h3 className="truncate font-heading text-base font-bold text-brand-primary-dark transition-colors group-hover:text-brand-primary">
                        {property.title}
                      </h3>
                    </Link>
                    <p className="shrink-0 font-heading text-base font-bold text-brand-primary">
                      {formatPrice(listing.price)}
                      {listing.listing_type === "rent" &&
                      listing.rent_frequency
                        ? ` / ${listing.rent_frequency}`
                        : ""}
                    </p>
                  </div>

                  <p className="mt-1 truncate text-sm text-neutral-500">
                    {property.address_line1}, {property.city}
                  </p>

                  {/* Beds / baths / sqft */}
                  <div className="mt-4 flex items-center gap-4 border-t border-border pt-4 text-sm text-neutral-600">
                    <span className="flex items-center gap-1.5">
                      <Bed className="size-4 text-neutral-400" />
                      {property.bedrooms}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Bath className="size-4 text-neutral-400" />
                      {property.bathrooms}
                    </span>
                    {property.square_footage != null && (
                      <span className="flex items-center gap-1.5">
                        <Maximize className="size-4 text-neutral-400" />
                        {property.square_footage.toLocaleString("en-GB")}
                      </span>
                    )}
                  </div>

                  {/* Compare */}
                  <label className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-neutral-500">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-border text-brand-primary focus:ring-brand-primary"
                    />
                    Compare
                  </label>
                </div>
              </article>
            );
          })}

          {/* Add Property dashed tile */}
          <Link
            href="/search"
            className="flex min-h-[18rem] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface text-center transition-colors hover:border-brand-primary hover:bg-muted"
          >
            <div className="flex size-12 items-center justify-center rounded-full border border-border bg-white text-brand-primary">
              <Plus className="size-5" />
            </div>
            <span className="mt-4 font-heading text-base font-bold text-brand-primary-dark">
              Add Property
            </span>
            <span className="mt-1 max-w-[14rem] text-xs text-neutral-500">
              Search the portal to add a new property to your shortlist.
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
