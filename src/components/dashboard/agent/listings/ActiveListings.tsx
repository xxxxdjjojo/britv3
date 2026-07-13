"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, Bookmark, Mail, BedDouble, Bath, AreaChart } from "lucide-react";
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

function statusChipClass(status: string): string {
  const s = status.toLowerCase();
  if (s === "active" || s === "for sale" || s === "to let") {
    return "bg-success/10 text-success";
  }
  if (s === "under offer" || s === "let agreed") {
    return "bg-brand-gold text-brand-gold-foreground";
  }
  if (s === "sold stc" || s === "exchanged" || s === "completed") {
    return "bg-brand-primary/10 text-brand-primary";
  }
  if (s === "withdrawn" || s === "archived") {
    return "bg-error/10 text-error";
  }
  return "bg-neutral-100 text-neutral-600";
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
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-neutral-400 mb-1">
            Portfolio
          </p>
          <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-brand-primary-dark">
            Active Listings ({listings.length})
          </h1>
        </div>
        <div className="flex items-center gap-3 pt-1">
          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger className="w-48 rounded-xl border-border bg-white text-sm h-9">
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
      </div>

      {/* Empty state */}
      {sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface py-20 text-center">
          <AreaChart className="size-10 text-neutral-300 mb-3" />
          <p className="text-sm font-medium text-neutral-500">No active listings found.</p>
        </div>
      )}

      {/* Listing cards grid */}
      {sorted.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sorted.map((listing) => {
            const id = getStr(listing, "id");
            const title =
              getStr(listing, "title") ||
              getStr(listing, "address_line_1") ||
              "Untitled";
            const city = getStr(listing, "city");
            const postcode = getStr(listing, "postcode");
            const price = getNum(listing, "price");
            const status = getStr(listing, "status");
            const imageUrl = getStr(listing, "primary_image_url");
            const views = getNum(listing, "views");
            const saves = getNum(listing, "saves");
            const enquiries = getNum(listing, "enquiries");
            const bedrooms = getNum(listing, "bedrooms");
            const bathrooms = getNum(listing, "bathrooms");
            const locationParts = [city, postcode].filter(Boolean).join(", ");

            return (
              <article
                key={id}
                className="group overflow-hidden rounded-xl border border-border bg-white transition-shadow hover:shadow-md"
              >
                {/* Thumbnail */}
                <div className="relative h-52 bg-neutral-100 overflow-hidden">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={title}
                      fill
                      sizes="(max-width: 768px) 100vw, 400px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-300 text-sm">
                      No image
                    </div>
                  )}
                  {status && (
                    <span
                      className={`absolute top-3 left-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.1em] ${statusChipClass(status)}`}
                    >
                      {status}
                    </span>
                  )}
                </div>

                {/* Card body */}
                <div className="p-4 space-y-3">
                  {/* Title + location */}
                  <div>
                    <p className="font-semibold text-sm text-brand-primary-dark leading-snug line-clamp-2">
                      {title}
                    </p>
                    {locationParts && (
                      <p className="text-xs text-neutral-400 mt-0.5">{locationParts}</p>
                    )}
                  </div>

                  {/* Price */}
                  <p className="text-xl font-bold text-brand-primary-dark tracking-tight">
                    {formatGbp(price)}
                  </p>

                  {/* Beds / Baths row */}
                  {(bedrooms > 0 || bathrooms > 0) && (
                    <div className="flex items-center gap-3 text-xs text-neutral-500">
                      {bedrooms > 0 && (
                        <span className="flex items-center gap-1">
                          <BedDouble className="size-3.5 text-neutral-400" />
                          {bedrooms}
                        </span>
                      )}
                      {bathrooms > 0 && (
                        <span className="flex items-center gap-1">
                          <Bath className="size-3.5 text-neutral-400" />
                          {bathrooms}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Divider */}
                  <div className="border-t border-border" />

                  {/* Stats row */}
                  <div className="flex items-center gap-4 text-xs text-neutral-500">
                    <span className="flex items-center gap-1.5">
                      <Eye className="size-3.5 text-neutral-400" />
                      {views}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Bookmark className="size-3.5 text-neutral-400" />
                      {saves}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Mail className="size-3.5 text-neutral-400" />
                      {enquiries}
                    </span>
                    <Link
                      href={"/dashboard/agent/listings/" + id + "/analytics"}
                      className="ml-auto text-xs font-medium text-brand-primary hover:underline"
                    >
                      View analytics →
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
