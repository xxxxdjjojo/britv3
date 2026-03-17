"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortOption = "newest" | "price_high" | "price_low" | "most_views";

type Props = Readonly<{
  listings: Record<string, unknown>[];
}>;

function formatGbp(value: unknown): string {
  const num = typeof value === "number" ? value : Number(value ?? 0);
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(num);
}

function getStr(listing: Record<string, unknown>, key: string): string {
  const v = listing[key];
  return typeof v === "string" ? v : "";
}

function getNum(listing: Record<string, unknown>, key: string): number {
  const v = listing[key];
  return typeof v === "number" ? v : 0;
}

export function ActiveListings({ listings }: Props) {
  const [sort, setSort] = useState<SortOption>("newest");

  const sorted = useMemo(() => {
    const copy = [...listings];
    switch (sort) {
      case "price_high":
        return copy.sort((a, b) => getNum(b, "price") - getNum(a, "price"));
      case "price_low":
        return copy.sort((a, b) => getNum(a, "price") - getNum(b, "price"));
      case "most_views":
        return copy.sort((a, b) => getNum(b, "views") - getNum(a, "views"));
      default:
        return copy.sort(
          (a, b) =>
            new Date(getStr(b, "created_at")).getTime() -
            new Date(getStr(a, "created_at")).getTime(),
        );
    }
  }, [listings, sort]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-semibold text-foreground">
          Active Listings ({listings.length})
        </h1>
        <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="price_high">Price High-Low</SelectItem>
            <SelectItem value="price_low">Price Low-High</SelectItem>
            <SelectItem value="most_views">Most Views</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {sorted.length === 0 && (
        <p className="text-muted-foreground text-sm">No active listings found.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map((listing) => {
          const id = getStr(listing, "id");
          const title = getStr(listing, "title") || getStr(listing, "address_line_1") || "Untitled";
          const price = getNum(listing, "price");
          const status = getStr(listing, "status");
          const imageUrl = getStr(listing, "primary_image_url");
          const views = getNum(listing, "views");
          const saves = getNum(listing, "saves");
          const enquiries = getNum(listing, "enquiries");

          return (
            <Card key={id} className="overflow-hidden">
              <div className="relative h-48 bg-muted">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                    No image
                  </div>
                )}
                {status && (
                  <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded-full uppercase">
                    {status}
                  </span>
                )}
              </div>
              <CardContent className="p-4 space-y-2">
                <p className="font-medium text-sm line-clamp-2">{title}</p>
                <p className="text-lg font-bold text-foreground">{formatGbp(price)}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>&#128065; {views}</span>
                  <span>&#128278; {saves}</span>
                  <span>&#9993; {enquiries}</span>
                </div>
                <a
                  href={"/dashboard/agent/listings/" + id + "/analytics"}
                  className="block text-xs text-primary hover:underline mt-1"
                >
                  View analytics &rarr;
                </a>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
