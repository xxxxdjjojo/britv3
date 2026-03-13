"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Home, Eye, Heart, MessageSquare, Plus } from "lucide-react";

const formatGBP = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(pence / 100);

type SortKey = "newest" | "price-high" | "price-low";

function sortListings(
  listings: Record<string, unknown>[],
  key: SortKey,
): Record<string, unknown>[] {
  const copy = [...listings];
  switch (key) {
    case "newest":
      return copy.sort(
        (a, b) =>
          new Date(String(b.created_at ?? "")).getTime() -
          new Date(String(a.created_at ?? "")).getTime(),
      );
    case "price-high":
      return copy.sort(
        (a, b) => Number(b.price ?? 0) - Number(a.price ?? 0),
      );
    case "price-low":
      return copy.sort(
        (a, b) => Number(a.price ?? 0) - Number(b.price ?? 0),
      );
    default:
      return copy;
  }
}

export function ActiveListings(
  props: Readonly<{ listings: Record<string, unknown>[]; count: number }>,
) {
  const [sortKey, setSortKey] = useState<SortKey>("newest");

  const sorted = useMemo(
    () => sortListings(props.listings, sortKey),
    [props.listings, sortKey],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Active Listings</h1>
          <p className="text-muted-foreground">
            {props.count} active {props.count === 1 ? "listing" : "listings"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={sortKey}
            onValueChange={(v) => { if (v) setSortKey(v as SortKey); }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="price-high">Price: high to low</SelectItem>
              <SelectItem value="price-low">Price: low to high</SelectItem>
            </SelectContent>
          </Select>
          <Button render={<Link href="/dashboard/agent/listings/create" />}>
            <Plus className="mr-2 size-4" />
            Create Listing
          </Button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Home className="mb-4 size-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No active listings</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first listing to get started.
            </p>
            <Button className="mt-4" render={<Link href="/dashboard/agent/listings/create" />}>
              <Plus className="mr-2 size-4" />
              Create Listing
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sorted.map((listing) => {
            const id = String(listing.id ?? "");
            const address = String(
              listing.address_line_1 ?? listing.title ?? "Untitled",
            );
            const city = listing.city ? `, ${String(listing.city)}` : "";
            const postcode = listing.postcode
              ? ` ${String(listing.postcode)}`
              : "";
            const price = Number(listing.price ?? 0);
            const views = Number(listing.views_count ?? 0);
            const saves = Number(listing.saves_count ?? 0);
            const enquiries = Number(listing.enquiries_count ?? 0);
            const status = String(listing.status ?? "active");

            return (
              <Link
                key={id}
                href={`/dashboard/agent/listings/${id}/analytics`}
                className="group"
              >
                <Card className="transition-shadow hover:shadow-md">
                  {/* Image placeholder */}
                  <div className="flex h-40 items-center justify-center rounded-t-lg bg-muted">
                    <Home className="size-10 text-muted-foreground" />
                  </div>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {address}
                          {city}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {postcode}
                        </p>
                      </div>
                      <Badge variant="default" className="shrink-0 capitalize">
                        {status}
                      </Badge>
                    </div>

                    <p className="text-lg font-bold">
                      {price > 0 ? formatGBP(price) : "Price on application"}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="size-3" />
                        {views}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="size-3" />
                        {saves}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="size-3" />
                        {enquiries}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
