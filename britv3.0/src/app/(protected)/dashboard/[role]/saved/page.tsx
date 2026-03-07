import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSavedProperties } from "@/services/saved/saved-properties-service";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Search, Bed, Bath, MapPin } from "lucide-react";
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">
          Saved Properties
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {savedProperties.length}{" "}
          {savedProperties.length === 1 ? "property" : "properties"} saved
        </p>
      </div>

      {savedProperties.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-neutral-100">
              <Heart className="size-8 text-neutral-400" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-neutral-900">
              No saved properties yet
            </h3>
            <p className="mt-2 max-w-md text-sm text-neutral-500">
              You haven&apos;t saved any properties yet. Start searching to find
              properties you like.
            </p>
            <Link href="/search" className="mt-4">
              <Button variant="outline" className="gap-2">
                <Search className="size-4" />
                Search Properties
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {savedProperties.map((saved) => {
            const { listing, property } = saved;

            return (
              <Card key={saved.id} className="overflow-hidden">
                {/* Image */}
                <div className="relative aspect-[4/3] bg-neutral-100">
                  <Link href={`/property/${listing.slug ?? listing.id}`}>
                    <div className="size-full">
                      <div className="flex size-full items-center justify-center text-neutral-300">
                        <Heart className="size-12" />
                      </div>
                    </div>
                  </Link>
                  <SavedPropertyRemoveButton listingId={listing.id} />
                </div>

                <CardContent className="p-4">
                  <Link href={`/property/${listing.slug ?? listing.id}`}>
                    <h3 className="truncate font-medium text-neutral-900 hover:text-brand-accent">
                      {property.title}
                    </h3>
                  </Link>

                  <div className="mt-1 flex items-center gap-1 text-sm text-neutral-500">
                    <MapPin className="size-3.5" />
                    <span className="truncate">
                      {property.address_line1}, {property.city}
                    </span>
                  </div>

                  <p className="mt-2 text-lg font-bold text-neutral-900">
                    {formatPrice(listing.price)}
                    {listing.listing_type === "rent" && listing.rent_frequency
                      ? ` / ${listing.rent_frequency}`
                      : ""}
                  </p>

                  <div className="mt-2 flex items-center gap-3 text-sm text-neutral-500">
                    <span className="flex items-center gap-1">
                      <Bed className="size-3.5" />
                      {property.bedrooms}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bath className="size-3.5" />
                      {property.bathrooms}
                    </span>
                    <Badge variant="outline" className="text-xs capitalize">
                      {property.property_type.replace("_", " ")}
                    </Badge>
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
