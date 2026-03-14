"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, Calendar, Clock, PoundSterling } from "lucide-react";

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
  created_at: string;
  listed_at?: string | null;
  sold_at?: string | null;
  commission_amount?: number | null;
};

function formatPrice(pence: number | null | undefined): string {
  if (pence == null) return "N/A";
  const pounds = pence / 100;
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(pounds);
}

function getTimeOnMarket(listing: Listing): string {
  const start = listing.listed_at ?? listing.created_at;
  const end = listing.sold_at ?? new Date().toISOString();
  const days = Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (days < 1) return "Less than a day";
  if (days === 1) return "1 day";
  if (days < 7) return `${days} days`;
  const weeks = Math.round(days / 7);
  return `${weeks} week${weeks === 1 ? "" : "s"}`;
}

function getAddress(listing: Listing): string {
  const parts = [listing.address_line_1, listing.city, listing.postcode].filter(Boolean);
  return parts.join(", ") || "Address not provided";
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "N/A";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
}

type Props = Readonly<{
  listings: Record<string, unknown>[];
}>;

export function SoldLetListings({ listings }: Props) {
  const typed = listings as unknown as Listing[];

  if (typed.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Home className="size-10 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No sold or let listings yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {typed.map((listing) => (
        <Card key={listing.id}>
          <CardContent className="py-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{getAddress(listing)}</p>
                  <Badge
                    variant={listing.status === "sold" ? "default" : "secondary"}
                    className="capitalize text-xs shrink-0"
                  >
                    {listing.status ?? "sold"}
                  </Badge>
                </div>
                {listing.title && (
                  <p className="text-sm text-muted-foreground">{listing.title}</p>
                )}
                {listing.property_type && (
                  <p className="text-xs text-muted-foreground capitalize">
                    {listing.bedrooms ? `${listing.bedrooms} bed ` : ""}
                    {listing.property_type}
                  </p>
                )}
              </div>

              <div className="text-right shrink-0">
                <p className="text-lg font-bold">{formatPrice(listing.price)}</p>
                {listing.commission_amount != null && (
                  <p className="text-xs text-green-600 flex items-center justify-end gap-1 mt-1">
                    <PoundSterling className="size-3" />
                    Commission: {formatPrice(listing.commission_amount)}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-6 text-xs text-muted-foreground flex-wrap">
              {listing.sold_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  Completed: {formatDate(listing.sold_at)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                Time on market: {getTimeOnMarket(listing)}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
