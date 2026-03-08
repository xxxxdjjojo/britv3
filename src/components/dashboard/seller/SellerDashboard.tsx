"use client";

/**
 * Seller dashboard content.
 * Shows listing performance, viewing requests, offers, and quick actions.
 */

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tag, Eye, Calendar, PoundSterling } from "lucide-react";
import type { SellerDashboard as SellerData } from "@/types/dashboard";

const LISTING_STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  under_offer: "outline",
  sold: "secondary",
  withdrawn: "destructive",
};

const OFFER_STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  accepted: "default",
  rejected: "destructive",
  withdrawn: "secondary",
};

export function SellerDashboard({ data }: Readonly<{ data: SellerData }>) {
  const hasListings = data.listings.length > 0;
  const hasViewings = data.viewing_requests.length > 0;
  const hasOffers = data.offers.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Listing Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Tag className="size-4" />
            Listing Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasListings ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="text-right">Saves</TableHead>
                    <TableHead className="text-right">Enquiries</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.listings.map((listing) => (
                    <TableRow key={listing.id}>
                      <TableCell className="max-w-[200px] truncate font-medium">
                        {listing.address}
                      </TableCell>
                      <TableCell className="text-right">{listing.views_count}</TableCell>
                      <TableCell className="text-right">{listing.saves_count}</TableCell>
                      <TableCell className="text-right">{listing.enquiries_count}</TableCell>
                      <TableCell>
                        <Badge variant={LISTING_STATUS_VARIANTS[listing.status] ?? "secondary"}>
                          {listing.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Tag className="text-muted-foreground size-8" />
              <p className="text-sm font-medium">No listings yet</p>
              <p className="text-muted-foreground max-w-xs text-xs">
                List your first property to start tracking its performance.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Viewing Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="size-4" />
            Viewing Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasViewings ? (
            <div className="flex flex-col gap-3">
              {data.viewing_requests.map((viewing) => (
                <div
                  key={viewing.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-medium">{viewing.property_address}</p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(viewing.scheduled_at).toLocaleDateString("en-GB", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <Badge
                    variant={viewing.status === "confirmed" ? "default" : "secondary"}
                  >
                    {viewing.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Eye className="text-muted-foreground size-8" />
              <p className="text-sm font-medium">No viewing requests</p>
              <p className="text-muted-foreground max-w-xs text-xs">
                Viewing requests from interested buyers will appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Offers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PoundSterling className="size-4" />
            Offers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasOffers ? (
            <div className="flex flex-col gap-3">
              {data.offers.map((offer) => (
                <div
                  key={offer.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-medium">{offer.property_address}</p>
                    <p className="text-muted-foreground text-xs">
                      £{offer.amount.toLocaleString()} --{" "}
                      {new Date(offer.submitted_at).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                  <Badge variant={OFFER_STATUS_VARIANTS[offer.status] ?? "secondary"}>
                    {offer.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <PoundSterling className="text-muted-foreground size-8" />
              <p className="text-sm font-medium">No offers yet</p>
              <p className="text-muted-foreground max-w-xs text-xs">
                Offers from buyers will appear here once your property is listed.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Empty overall state */}
      {!hasListings && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <Tag className="text-muted-foreground size-10" />
            <h3 className="text-lg font-semibold">List your first property</h3>
            <p className="text-muted-foreground max-w-sm text-sm">
              Create a listing to start receiving viewings and offers from buyers.
            </p>
            <Button render={<Link href="/dashboard/seller/listings/new" />}>Create Listing</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
