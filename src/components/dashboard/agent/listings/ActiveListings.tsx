"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Heart, MessageSquare, Home, BarChart2 } from "lucide-react";

type Listing = {
  id: string;
  title?: string | null;
  address_line_1?: string | null;
  city?: string | null;
  postcode?: string | null;
  price?: number | null;
  status?: string | null;
  property_type?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  views_count?: number | null;
  saves_count?: number | null;
  enquiries_count?: number | null;
  created_at: string;
  image_url?: string | null;
};

type SortKey = "newest" | "price_desc" | "price_asc" | "most_views";

function sortListings(listings: Listing[], sort: SortKey): Listing[] {
  return [...listings].sort((a, b) => {
    if (sort === "newest") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (sort === "price_desc") {
      return (b.price ?? 0) - (a.price ?? 0);
    }
    if (sort === "price_asc") {
      return (a.price ?? 0) - (b.price ?? 0);
    }
    if (sort === "most_views") {
      return (b.views_count ?? 0) - (a.views_count ?? 0);
    }
    return 0;
  });
}

function formatPrice(pence: number | null | undefined): string {
  if (pence == null) return "POA";
  const pounds = pence / 100;
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(pounds);
}

function getAddress(listing: Listing): string {
  const parts = [listing.address_line_1, listing.city, listing.postcode].filter(Boolean);
  return parts.join(", ") || "Address not provided";
}

type Props = Readonly<{
  listings: Record<string, unknown>[];
}>;

export function ActiveListings({ listings }: Props) {
  const [sort, setSort] = useState<SortKey>("newest");

  const typed = listings as unknown as Listing[];
  const sorted = sortListings(typed, sort);

  if (sorted.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Home className="size-10 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No active listings yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Click &ldquo;Add Listing&rdquo; to publish your first property.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="price_desc">Price: High to Low</SelectItem>
            <SelectItem value="price_asc">Price: Low to High</SelectItem>
            <SelectItem value="most_views">Most views</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((listing) => (
          <Card key={listing.id} className="overflow-hidden">
            {listing.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={listing.image_url}
                alt={listing.title ?? "Property image"}
                className="h-40 w-full object-cover"
              />
            ) : (
              <div className="h-40 w-full bg-muted flex items-center justify-center">
                <Home className="size-10 text-muted-foreground" />
              </div>
            )}

            <CardContent className="pt-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5 min-w-0">
                  <p className="font-semibold text-sm truncate">{getAddress(listing)}</p>
                  {listing.title && (
                    <p className="text-xs text-muted-foreground truncate">{listing.title}</p>
                  )}
                </div>
                <Badge variant="default" className="shrink-0 text-xs">
                  {listing.status ?? "active"}
                </Badge>
              </div>

              <p className="text-lg font-bold">{formatPrice(listing.price)}</p>

              {(listing.bedrooms || listing.bathrooms || listing.property_type) && (
                <p className="text-xs text-muted-foreground">
                  {[
                    listing.bedrooms ? `${listing.bedrooms} bed` : null,
                    listing.bathrooms ? `${listing.bathrooms} bath` : null,
                    listing.property_type,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}

              <div className="flex items-center gap-4 pt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="size-3" />
                  {listing.views_count ?? 0}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="size-3" />
                  {listing.saves_count ?? 0}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="size-3" />
                  {listing.enquiries_count ?? 0}
                </span>
              </div>
            </CardContent>

            <CardFooter className="gap-2 pt-0">
              <Button variant="outline" size="sm" asChild className="flex-1">
                <Link href={`/dashboard/agent/listings/${listing.id}/analytics`}>
                  <BarChart2 className="mr-1 size-3" />
                  Analytics
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="flex-1">
                <Link href={`/dashboard/agent/listings/${listing.id}`}>
                  View
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
